"""Statikus szerkezet-elemzo a Python megoldasokhoz (#43).

Bemenet (stdin): a vizsgalt forraskod, UTF-8.
Kimenet (stdout): egyetlen JSON objektum:

    {"ok": true,
     "for_loop": bool, "while_loop": bool, "recursion": bool,
     "builtin_calls": [..], "method_calls": [..], "dynamic_calls": bool}

vagy {"ok": false, "error": "syntax"|"too_complex"|"..."}.

A kodot SOHA nem futtatja: csak ast.parse + bejaras. A beepitett nev hivasa
csak akkor szamit "builtin"-nek, ha a megoldas nem definialta/rendelte hozza
sajat magat (pl. sajat `def sum(...)`). Az eval/exec/getattr, illetve a
`builtins`/`__builtins__` hasznalata "dynamic_calls": ezekkel barmelyik
tiltott fuggveny megkerulheto lenne.
"""

import ast
import builtins
import json
import sys

DYNAMIC_NAMES = {"eval", "exec", "getattr", "__import__", "globals", "locals", "vars", "compile"}
BUILTIN_NAMES = set(dir(builtins))


class Analyzer(ast.NodeVisitor):
    def __init__(self) -> None:
        self.for_loop = False
        self.while_loop = False
        self.recursion = False
        self.dynamic = False
        self.defined: set[str] = set()
        self.called_names: set[str] = set()
        self.method_calls: set[str] = set()
        self._function_stack: list[str] = []

    # --- definiciok: ezek a nevek mar nem a beepitett fuggvenyek ---------------
    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.defined.add(node.name)
        self._function_stack.append(node.name)
        self.generic_visit(node)
        self._function_stack.pop()

    visit_AsyncFunctionDef = visit_FunctionDef  # type: ignore[assignment]

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        self.defined.add(node.name)
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name) -> None:
        if isinstance(node.ctx, (ast.Store, ast.Del)):
            self.defined.add(node.id)
        if node.id in ("builtins", "__builtins__"):
            self.dynamic = True
        self.generic_visit(node)

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            if alias.name.split(".")[0] == "builtins":
                self.dynamic = True
            self.defined.add((alias.asname or alias.name).split(".")[0])
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        if node.module == "builtins":
            self.dynamic = True
        for alias in node.names:
            self.defined.add(alias.asname or alias.name)
        self.generic_visit(node)

    # --- szerkezetek ------------------------------------------------------------
    def visit_For(self, node: ast.For) -> None:
        self.for_loop = True
        self.generic_visit(node)

    visit_AsyncFor = visit_For  # type: ignore[assignment]

    def visit_While(self, node: ast.While) -> None:
        self.while_loop = True
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        func = node.func
        if isinstance(func, ast.Name):
            self.called_names.add(func.id)
            if func.id in DYNAMIC_NAMES:
                self.dynamic = True
            if func.id in self._function_stack:
                self.recursion = True
        elif isinstance(func, ast.Attribute):
            self.method_calls.add(func.attr)
        self.generic_visit(node)


def main() -> None:
    source = sys.stdin.buffer.read().decode("utf-8", errors="replace")
    try:
        tree = ast.parse(source)
    except SyntaxError:
        print(json.dumps({"ok": False, "error": "syntax"}))
        return
    except (RecursionError, MemoryError, ValueError):
        print(json.dumps({"ok": False, "error": "too_complex"}))
        return

    analyzer = Analyzer()
    try:
        analyzer.visit(tree)
    except RecursionError:
        print(json.dumps({"ok": False, "error": "too_complex"}))
        return

    builtin_calls = sorted(
        name for name in analyzer.called_names if name in BUILTIN_NAMES and name not in analyzer.defined
    )

    print(json.dumps({
        "ok": True,
        "for_loop": analyzer.for_loop,
        "while_loop": analyzer.while_loop,
        "recursion": analyzer.recursion,
        "builtin_calls": builtin_calls,
        "method_calls": sorted(analyzer.method_calls),
        "dynamic_calls": analyzer.dynamic,
    }))


if __name__ == "__main__":
    main()
