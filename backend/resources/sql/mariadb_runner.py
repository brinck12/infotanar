# -*- coding: utf-8 -*-
# SQL-feladat futtatoja a Judge0 Python (3.8) kornyezeteben.
#
# A diak lekerdezese SQLite-on fut, de az erettsegi MariaDB-jenek gyakori
# fuggvenyeit (YEAR, CONCAT, IF, DATEDIFF, DATE_FORMAT, ...) a program
# regisztralja, es a `/` a MariaDB-hez hasonloan tort osztas. A kimenet ugyanaz,
# mint a sqlite3 CLI `.headers on` + `.mode csv` kimenete (ures eredmenynel nincs fejlec),
# hibanal "Error: ..." a stderr-en es nem nulla kilepesi kod.
#
# A SqlProgram a DATASET es QUERY konstans helyere base64-ben beilleszti az
# adatkeszlet-szkriptet es a diak lekerdezeset. Ez a fajl Python 3.8-on is fusson.
import base64
import csv
import datetime
import io
import math
import re
import sqlite3
import sys

DATASET = base64.b64decode("__DATASET_B64__").decode("utf-8")
QUERY = base64.b64decode("__QUERY_B64__").decode("utf-8")

MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


# --- segedek -----------------------------------------------------------------

def to_text(value):
    if isinstance(value, float):
        return fmt_float(value)
    return str(value)


def fmt_float(value):
    if value != value or value in (float("inf"), float("-inf")):
        return ""
    text = "%.15g" % value
    if "." not in text and "e" not in text and "n" not in text:
        text += ".0"
    return text


def parse_dt(value):
    """'ÉÉÉÉ-HH-NN' vagy 'ÉÉÉÉ-HH-NN ÓÓ:PP[:MM]' -> datetime, ismeretlen formatumra None."""
    if value is None:
        return None
    text = str(value).strip().replace("T", " ")
    for pattern in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.datetime.strptime(text[:19] if len(text) > 10 else text, pattern)
        except ValueError:
            continue
    return None


def parse_time(value):
    if value is None:
        return None
    text = str(value).strip()
    for pattern in ("%H:%M:%S", "%H:%M"):
        try:
            parsed = datetime.datetime.strptime(text, pattern)
            return parsed
        except ValueError:
            continue
    dt = parse_dt(value)
    return dt


def part(attribute):
    def getter(value):
        dt = parse_dt(value) if attribute in ("year", "month", "day") else parse_time(value)
        return None if dt is None else getattr(dt, attribute)
    return getter


def null_if_any_null(function):
    def wrapper(*args):
        if any(arg is None for arg in args):
            return None
        return function(*args)
    return wrapper


# --- sztring-fuggvenyek ------------------------------------------------------

def f_concat(*args):
    if any(arg is None for arg in args):
        return None
    return "".join(to_text(arg) for arg in args)


def f_concat_ws(separator, *args):
    if separator is None:
        return None
    return str(separator).join(to_text(arg) for arg in args if arg is not None)


def f_left(text, count):
    return None if text is None or count is None else str(text)[:max(int(count), 0)]


def f_right(text, count):
    if text is None or count is None:
        return None
    count = int(count)
    return "" if count <= 0 else str(text)[-count:]


def f_lpad(text, length, pad):
    if text is None or length is None or pad is None:
        return None
    text, length, pad = str(text), int(length), str(pad)
    if length <= len(text):
        return text[:max(length, 0)]
    if pad == "":
        return None
    fill = (pad * length)[:length - len(text)]
    return fill + text


def f_rpad(text, length, pad):
    if text is None or length is None or pad is None:
        return None
    text, length, pad = str(text), int(length), str(pad)
    if length <= len(text):
        return text[:max(length, 0)]
    if pad == "":
        return None
    fill = (pad * length)[:length - len(text)]
    return text + fill


def f_locate(sub, text, position=1):
    if sub is None or text is None or position is None:
        return None
    position = int(position)
    if position < 1:
        return 0
    return str(text).find(str(sub), position - 1) + 1


def f_format(number, decimals):
    if number is None or decimals is None:
        return None
    return "{:,.{}f}".format(float(number), max(int(decimals), 0))


def f_substring(text, position, length=None):
    if text is None or position is None:
        return None
    text, position = str(text), int(position)
    if length is not None:
        length = int(length)
        if length < 1:
            return ""
    if position == 0:
        return ""
    start = position - 1 if position > 0 else len(text) + position
    if start < 0 or start >= len(text):
        return ""
    return text[start:] if length is None else text[start:start + length]


# --- szam-fuggvenyek ---------------------------------------------------------

def f_round1(number):
    if number is None:
        return None
    number = float(number)
    rounded = math.floor(abs(number) + 0.5)
    return int(-rounded if number < 0 else rounded)


def f_truncate(number, decimals):
    if number is None or decimals is None:
        return None
    factor = 10 ** int(decimals)
    return math.trunc(float(number) * factor) / factor


def f_mod(a, b):
    if a is None or b is None or b == 0:
        return None
    return math.fmod(a, b) if isinstance(a, float) or isinstance(b, float) else int(math.fmod(a, b))


def f_greatest(*args):
    return None if any(a is None for a in args) else max(args)


def f_least(*args):
    return None if any(a is None for a in args) else min(args)


def f_sign(number):
    return None if number is None else (number > 0) - (number < 0)


def f_pow(base, exponent):
    if base is None or exponent is None:
        return None
    try:
        return float(base) ** float(exponent)
    except (ValueError, ZeroDivisionError, OverflowError):
        return None


def f_sqrt(number):
    return None if number is None or number < 0 else math.sqrt(number)


def f_log(*args):
    try:
        if any(a is None for a in args):
            return None
        if len(args) == 1:
            return math.log(args[0])
        return math.log(args[1], args[0])
    except (ValueError, ZeroDivisionError):
        return None


def f_ln(number):
    try:
        return None if number is None else math.log(number)
    except ValueError:
        return None


# --- datum-fuggvenyek --------------------------------------------------------

def f_date(value):
    dt = parse_dt(value)
    return None if dt is None else dt.strftime("%Y-%m-%d")


def f_time(value):
    dt = parse_dt(value)
    return None if dt is None else dt.strftime("%H:%M:%S")


def f_datediff(a, b):
    first, second = parse_dt(a), parse_dt(b)
    if first is None or second is None:
        return None
    return (first.date() - second.date()).days


def f_adddate(value, days):
    dt = parse_dt(value)
    if dt is None or days is None:
        return None
    moved = dt + datetime.timedelta(days=int(days))
    return moved.strftime("%Y-%m-%d %H:%M:%S") if " " in str(value).strip() else moved.strftime("%Y-%m-%d")


def f_subdate(value, days):
    return None if days is None else f_adddate(value, -int(days))


def f_dayofweek(value):
    dt = parse_dt(value)
    return None if dt is None else (dt.weekday() + 1) % 7 + 1


def f_weekday(value):
    dt = parse_dt(value)
    return None if dt is None else dt.weekday()


def f_dayname(value):
    dt = parse_dt(value)
    return None if dt is None else DAYS[dt.weekday()]


def f_monthname(value):
    dt = parse_dt(value)
    return None if dt is None else MONTHS[dt.month - 1]


def f_quarter(value):
    dt = parse_dt(value)
    return None if dt is None else (dt.month - 1) // 3 + 1


def f_dayofyear(value):
    dt = parse_dt(value)
    return None if dt is None else dt.timetuple().tm_yday


def f_last_day(value):
    dt = parse_dt(value)
    if dt is None:
        return None
    first_next = (dt.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
    return (first_next - datetime.timedelta(days=1)).strftime("%Y-%m-%d")


def f_date_format(value, pattern):
    dt = parse_dt(value)
    if dt is None or pattern is None:
        return None
    hour12 = dt.hour % 12 or 12
    table = {
        "Y": "%04d" % dt.year, "y": "%02d" % (dt.year % 100),
        "m": "%02d" % dt.month, "c": str(dt.month),
        "d": "%02d" % dt.day, "e": str(dt.day),
        "H": "%02d" % dt.hour, "k": str(dt.hour),
        "h": "%02d" % hour12, "I": "%02d" % hour12, "l": str(hour12),
        "i": "%02d" % dt.minute, "S": "%02d" % dt.second, "s": "%02d" % dt.second,
        "p": "AM" if dt.hour < 12 else "PM",
        "T": dt.strftime("%H:%M:%S"),
        "j": "%03d" % dt.timetuple().tm_yday,
        "M": MONTHS[dt.month - 1], "b": MONTHS[dt.month - 1][:3],
        "W": DAYS[dt.weekday()], "a": DAYS[dt.weekday()][:3],
        "w": str((dt.weekday() + 1) % 7),
        "%": "%",
    }
    out = []
    chars = iter(str(pattern))
    for ch in chars:
        if ch != "%":
            out.append(ch)
            continue
        code = next(chars, "")
        out.append(table.get(code, code))
    return "".join(out)


def f_now():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def f_curdate():
    return datetime.date.today().strftime("%Y-%m-%d")


def f_curtime():
    return datetime.datetime.now().strftime("%H:%M:%S")


def f_if(condition, yes, no):
    if condition is None:
        return no
    if isinstance(condition, str):
        try:
            condition = float(condition)
        except ValueError:
            condition = 0
    return yes if condition else no


def f_isnull(value):
    return 1 if value is None else 0


def register(conn):
    simple = [
        ("CONCAT", -1, f_concat),
        ("CONCAT_WS", -1, f_concat_ws),
        ("FN_LEFT", 2, f_left), ("FN_RIGHT", 2, f_right),
        ("LPAD", 3, f_lpad), ("RPAD", 3, f_rpad),
        ("LOCATE", 2, f_locate), ("LOCATE", 3, f_locate),
        ("FORMAT", 2, f_format),
        ("SUBSTRING", 2, f_substring), ("SUBSTRING", 3, f_substring),
        ("SUBSTR", 2, f_substring), ("SUBSTR", 3, f_substring),
        ("MID", 3, f_substring),
        ("CHAR_LENGTH", 1, null_if_any_null(lambda t: len(str(t)))),
        ("CHARACTER_LENGTH", 1, null_if_any_null(lambda t: len(str(t)))),
        ("UCASE", 1, null_if_any_null(lambda t: str(t).upper())),
        ("LCASE", 1, null_if_any_null(lambda t: str(t).lower())),
        ("REVERSE", 1, null_if_any_null(lambda t: str(t)[::-1])),
        ("REPEAT", 2, null_if_any_null(lambda t, n: str(t) * max(int(n), 0))),
        ("SPACE", 1, null_if_any_null(lambda n: " " * max(int(n), 0))),
        ("STRCMP", 2, null_if_any_null(lambda a, b: (str(a) > str(b)) - (str(a) < str(b)))),
        ("ROUND", 1, f_round1),
        ("FLOOR", 1, null_if_any_null(lambda n: int(math.floor(n)))),
        ("CEIL", 1, null_if_any_null(lambda n: int(math.ceil(n)))),
        ("CEILING", 1, null_if_any_null(lambda n: int(math.ceil(n)))),
        ("TRUNCATE", 2, f_truncate),
        ("MOD", 2, f_mod),
        ("POW", 2, f_pow), ("POWER", 2, f_pow),
        ("SQRT", 1, f_sqrt),
        ("SIGN", 1, f_sign),
        ("LOG", 1, f_log), ("LOG", 2, f_log), ("LN", 1, f_ln),
        ("LOG10", 1, null_if_any_null(lambda n: math.log10(n) if n > 0 else None)),
        ("LOG2", 1, null_if_any_null(lambda n: math.log2(n) if n > 0 else None)),
        ("EXP", 1, null_if_any_null(math.exp)),
        ("PI", 0, lambda: math.pi),
        ("GREATEST", -1, f_greatest), ("LEAST", -1, f_least),
        ("IF", 3, f_if),
        ("ISNULL", 1, f_isnull),
        ("YEAR", 1, part("year")), ("MONTH", 1, part("month")), ("DAY", 1, part("day")),
        ("DAYOFMONTH", 1, part("day")),
        ("HOUR", 1, part("hour")), ("MINUTE", 1, part("minute")), ("SECOND", 1, part("second")),
        ("DATE", 1, f_date), ("TIME", 1, f_time),
        ("DATEDIFF", 2, f_datediff),
        ("ADDDATE", 2, f_adddate), ("SUBDATE", 2, f_subdate),
        ("DAYOFWEEK", 1, f_dayofweek), ("WEEKDAY", 1, f_weekday),
        ("DAYNAME", 1, f_dayname), ("MONTHNAME", 1, f_monthname),
        ("QUARTER", 1, f_quarter), ("DAYOFYEAR", 1, f_dayofyear),
        ("LAST_DAY", 1, f_last_day),
        ("DATE_FORMAT", 2, f_date_format),
        ("NOW", 0, f_now), ("CURDATE", 0, f_curdate), ("CURTIME", 0, f_curtime),
        ("CURRENT_TIMESTAMP", 0, f_now), ("SYSDATE", 0, f_now),
    ]
    for name, arity, function in simple:
        conn.create_function(name, arity, function)


# --- SQL-atalakitas (MariaDB -> SQLite) --------------------------------------

def rewrite(sql):
    """A sztringeken, azonositokon es megjegyzeseken kivul: a `/` tort osztas,
    a `#` sorvegi megjegyzes. A tobbit (pl. a kulcsszavakat) nem erinti."""
    out = []
    i, n = 0, len(sql)
    while i < n:
        ch = sql[i]
        if ch in ("'", '"', "`"):
            j = i + 1
            while j < n:
                if sql[j] == ch:
                    if j + 1 < n and sql[j + 1] == ch:
                        j += 2
                        continue
                    break
                j += 1
            out.append(sql[i:j + 1])
            i = j + 1
        elif sql.startswith("--", i):
            j = sql.find("\n", i)
            j = n if j < 0 else j
            out.append(sql[i:j])
            i = j
        elif ch == "#":
            j = sql.find("\n", i)
            j = n if j < 0 else j
            out.append("--" + sql[i + 1:j])
            i = j
        elif sql.startswith("/*", i):
            j = sql.find("*/", i + 2)
            j = n if j < 0 else j + 2
            out.append(sql[i:j])
            i = j
        elif ch == "/":
            out.append(" * 1.0 / ")
            i += 1
        elif ch.isalpha() or ch == "_":
            j = i
            while j < n and (sql[j].isalnum() or sql[j] == "_"):
                j += 1
            word = sql[i:j]
            # A LEFT es RIGHT az SQLite-ban kulcsszo (JOIN): fuggvenykent atnevezzuk.
            if word.upper() in ("LEFT", "RIGHT") and sql[j:].lstrip().startswith("("):
                word = "FN_" + word.upper()
            out.append(word)
            i = j
        else:
            out.append(ch)
            i += 1
    return "".join(out)


SKIPPED = re.compile(r"^\s*(?:CREATE\s+DATABASE|DROP\s+DATABASE|USE)\b", re.IGNORECASE)


def statements(script):
    buffer = ""
    for piece in script.split(";"):
        buffer += piece + ";"
        if sqlite3.complete_statement(buffer):
            yield buffer
            buffer = ""
    if buffer.strip(" \t\r\n;"):
        yield buffer.rstrip(";")


# --- futtatas ----------------------------------------------------------------

def emit(stream, text):
    """UTF-8 kimenet a futtatokornyezet nyelvi beallitasatol fuggetlenul."""
    stream.flush()
    stream.buffer.write(text.encode("utf-8", "replace"))
    stream.buffer.flush()


def fail(message):
    emit(sys.stderr, "Error: %s\n" % message)
    sys.exit(1)


def cell(value):
    if value is None:
        return ""
    if isinstance(value, float):
        return fmt_float(value)
    if isinstance(value, bytes):
        return value.decode("utf-8", "replace")
    return value


def main():
    conn = sqlite3.connect(":memory:")
    conn.isolation_level = None
    register(conn)

    try:
        conn.executescript(DATASET)
    except sqlite3.Error as error:
        fail("adatkeszlet: %s" % error)

    writer_buffer = io.StringIO()
    writer = csv.writer(writer_buffer, lineterminator="\n")

    for statement in statements(rewrite(QUERY)):
        if not statement.strip(" \t\r\n;") or SKIPPED.match(statement):
            continue
        try:
            cursor = conn.execute(statement)
            rows = cursor.fetchall() if cursor.description else []
        except sqlite3.Error as error:
            emit(sys.stdout, writer_buffer.getvalue())
            fail(error)
        if cursor.description and rows:
            writer.writerow([column[0] for column in cursor.description])
            for row in rows:
                writer.writerow([cell(value) for value in row])

    emit(sys.stdout, writer_buffer.getvalue())


main()
