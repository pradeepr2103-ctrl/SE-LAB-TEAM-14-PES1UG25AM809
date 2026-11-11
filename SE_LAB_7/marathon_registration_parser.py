import re

_DIGITS = re.compile(r"[0-9]{1,9}", re.ASCII)  # ASCII digits only, bounded length


def _to_int(part):
    """Return int for a plain ASCII-digit string (max 9 digits), else None."""
    if _DIGITS.fullmatch(part) is None:
        return None
    return int(part)


def format_bib_name(name):
    """
    Upper-cases a runner's name and cuts it to 12 characters for the bib.
    Never crashes: returns "" if name is not a string (e.g. None).
    """
    if not isinstance(name, str):
        return ""
    return name.strip().upper()[:12]


def parse_finish_time(text):
    """
    Converts a finish time written as H:MM:SS into seconds.
    Returns None for any invalid input (not a string, wrong number of parts,
    non-numeric, negative, minutes/seconds >= 60).
    """
    if not isinstance(text, str):
        return None
    parts = text.strip().split(':')
    if len(parts) != 3:
        return None
    values = [_to_int(p) for p in parts]
    if None in values:
        return None
    hours, minutes, seconds = values
    if minutes >= 60 or seconds >= 60:
        return None
    return hours * 3600 + minutes * 60 + seconds


def average_split(text):
    """
    Averages split times given in minutes, separated by spaces.
    Returns None for any invalid input (not a string, no splits,
    or any split that is not a non-negative whole number).
    """
    if not isinstance(text, str):
        return None
    tokens = text.split()
    if not tokens:
        return None
    splits = [_to_int(t) for t in tokens]
    if None in splits:
        return None
    return sum(splits) / len(splits)


def main():
    print("==== Running format_bib_name ====")
    value = input("Enter the name to print on the bib: ")
    print("Bib name:", format_bib_name(value))

    print("\n==== Running parse_finish_time ====")
    value = input("Enter a finish time as H:MM:SS (e.g. 3:45:10): ")
    result = parse_finish_time(value)
    print("Finish time in seconds:", result if result is not None else "Invalid time format")

    print("\n==== Running average_split ====")
    value = input("Enter your 5 km split times in minutes separated by spaces (e.g. 25 26 24): ")
    result = average_split(value)
    print("Average split (minutes):", result if result is not None else "Invalid split times")


if __name__ == "__main__":
    main()