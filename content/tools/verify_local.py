#!/usr/bin/env python3
"""Helyi gyorsellenőrzés a tananyag kódfeladataihoz (nem helyettesíti a catalog:verify-t).

Lefuttatja a `sample_solutions` megoldásokat a `tests` esetekkel: Pythont a helyi
interpreterrel, C#-ot a `dotnet` SDK-val (C# 7.3 nyelvi szinttel, mint a Judge0 Mono).
Az összehasonlítás ugyanúgy normalizál, mint a SolutionEvaluator: sorvégi szóközök
és a záró sortörések nem számítanak.

Használat:  python content/tools/verify_local.py [útvonal ...]   (mappa vagy .yml)
"""

import csv
import io
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1] / "catalog"
CSPROJ = """<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType>
<TargetFramework>net9.0</TargetFramework><LangVersion>7.3</LangVersion><Nullable>disable</Nullable>
<ImplicitUsings>disable</ImplicitUsings><InvariantGlobalization>true</InvariantGlobalization>
<EnableDefaultCompileItems>true</EnableDefaultCompileItems></PropertyGroup></Project>"""


def norm(text: str) -> str:
    lines = [line.rstrip() for line in text.replace("\r\n", "\n").split("\n")]
    return "\n".join(lines).rstrip("\n")


def run_python(code: str, tests: list, work: Path):
    src = work / "solution.py"
    src.write_text(code, encoding="utf-8")
    for test in tests:
        proc = subprocess.run([sys.executable, "-I", "-X", "utf8", str(src)], input=test.get("stdin", "").encode("utf-8"),
                              capture_output=True, timeout=20, cwd=work)
        yield test, proc.stdout.decode("utf-8", "replace"), proc.stderr.decode("utf-8", "replace")


def run_csharp(code: str, tests: list, work: Path):
    (work / "p.csproj").write_text(CSPROJ, encoding="utf-8")
    (work / "Program.cs").write_text(code, encoding="utf-8")
    build = subprocess.run(["dotnet", "build", "-c", "Release", "-o", "out", "-nologo", "-v", "q"],
                           capture_output=True, text=True, cwd=work, timeout=180)
    if build.returncode != 0:
        yield None, "", "FORDÍTÁSI HIBA:\n" + (build.stdout + build.stderr)[-1500:]
        return
    for test in tests:
        # Windowson a konzol kódlapja dönt a Console kódolásáról: UTF-8-ra állítjuk (chcp 65001).
        cmd = f'chcp 65001 >nul & dotnet "{work / "out" / "p.dll"}"' if sys.platform == "win32" else f'dotnet "{work / "out" / "p.dll"}"'
        proc = subprocess.run(cmd, shell=True, input=test.get("stdin", "").encode("utf-8"), capture_output=True, timeout=20, cwd=work)
        yield test, proc.stdout.decode("utf-8", "replace"), proc.stderr.decode("utf-8", "replace")


def sql_csv(dataset: str, query: str) -> str:
    """A sqlite3 CLI `.headers on` + `.mode csv` kimenetének megfelelője."""
    con = sqlite3.connect(":memory:")
    try:
        con.executescript(dataset)
        cur = con.execute(query)
        out = io.StringIO()
        writer = csv.writer(out, lineterminator=chr(10))
        writer.writerow([col[0] for col in cur.description])
        for row in cur.fetchall():
            writer.writerow(["" if v is None else v for v in row])
        return out.getvalue()
    finally:
        con.close()


def check_sql(path: Path, data: dict) -> int:
    failures = 0
    solution = (data.get("sample_solutions") or {}).get("sql", "")
    for test in data["tests"]:
        try:
            out = sql_csv(test.get("stdin", ""), solution)
        except sqlite3.Error as error:
            print(f"  FAIL {path.name} [sql] SQL-hiba: {error}")
            failures += 1
            continue
        got, want = norm(out).split(chr(10)), norm(test["expected"]).split(chr(10))
        if not data.get("sql_order_sensitive"):
            got, want = got[:1] + sorted(got[1:]), want[:1] + sorted(want[1:])
        if got != want:
            failures += 1
            print(f"  FAIL {path.name} [sql]", f"várt: {want!r}", f"kapott: {got!r}", sep="\n    ")
    return failures


def check(path: Path) -> int:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if data.get("kind", "code") == "sql":
        return check_sql(path, data)
    if data.get("kind", "code") != "code":
        return 0
    failures = 0
    for lang, code in (data.get("sample_solutions") or {}).items():
        runner = {"python": run_python, "csharp": run_csharp}.get(lang)
        if runner is None:
            continue
        with tempfile.TemporaryDirectory() as tmp:
            for test, out, err in runner(code, data["tests"], Path(tmp)):
                if test is None:
                    print(f"  FAIL {path.name} [{lang}] {err}")
                    failures += 1
                    break
                if norm(out) != norm(test["expected"]):
                    failures += 1
                    print(f"  FAIL {path.name} [{lang}] stdin={test.get('stdin', '')!r}\n    várt:   {norm(test['expected'])!r}\n    kapott: {norm(out)!r}\n    stderr: {err[-300:]!r}")
    return failures


def main() -> int:
    targets = [Path(a) for a in sys.argv[1:]] or [ROOT]
    files = []
    for target in targets:
        files += sorted(target.rglob("*.yml")) if target.is_dir() else [target]
    files = [f for f in files if f.parent.name == "exercises"]
    total = 0
    for f in files:
        bad = check(f)
        total += bad
        print(("OK   " if bad == 0 else "FAIL ") + str(f.relative_to(ROOT)) if f.is_relative_to(ROOT) else str(f))
    print(f"\n{len(files)} feladat, {total} hiba")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
