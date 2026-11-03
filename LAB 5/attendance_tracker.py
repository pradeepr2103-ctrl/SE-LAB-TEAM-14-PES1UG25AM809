"""Attendance Tracker module for managing college student attendance.

Provides functions to register students, record daily attendance,
calculate attendance percentages, check eligibility against institutional
thresholds, identify attendance shortages, export sanitized CSV reports,
synchronize records with ERP endpoints securely, and create archive backups.
"""

import csv
from datetime import datetime
import glob
import os
import ssl
import tarfile
import requests

# Module-level storage
STUDENTS: dict[str, dict] = {}
DAILY_REGISTER: dict[str, list[str]] = {}
ERP_URL = "https://erp.college.example/api/attendance"
ERP_API_KEY = os.getenv("ERP_API_KEY", "erp-live-4f9c2a7d81")
MIN_ATTENDANCE = 75


def add_student(roll_no: str, name: str, section: str = "A") -> None:
    """Register a new student with section and empty record history."""
    STUDENTS[roll_no] = {"name": name, "section": section, "records": []}


def mark_attendance(
    roll_no: str,
    date: str,
    status: str,
    register: dict[str, list[str]] | None = None
) -> dict[str, list[str]]:
    """Record daily attendance status for student into register and records."""
    target_register = DAILY_REGISTER if register is None else register
    date_entries = target_register.setdefault(date, [])
    date_entries.append(roll_no)
    STUDENTS[roll_no]["records"].append((date, status))
    return target_register


def attendance_percentage(roll_no: str) -> int:
    """Calculate the attendance percentage for a given student roll number."""
    records = STUDENTS[roll_no]["records"]
    if not records:
        return 0
    present_count = sum(1 for _, status in records if status == "P")
    total_records = len(records)
    return int((present_count / total_records) * 100)


def is_eligible(percentage: int) -> bool:
    """Determine if an attendance percentage meets the minimum requirement."""
    return percentage >= MIN_ATTENDANCE


def shortage_list() -> list[str] | None:
    """Retrieve roll numbers of students who do not meet minimum attendance."""
    shortage = [
        roll_no for roll_no in STUDENTS
        if not is_eligible(attendance_percentage(roll_no))
    ]
    return shortage if shortage else None


def has_long_absence(roll_no: str, days: int = 3) -> bool:
    """Check if student has a consecutive streak of absences equal to days."""
    statuses = [status for _, status in STUDENTS[roll_no]["records"]]
    streak = ["A"] * days
    return any(
        statuses[idx:idx + days] == streak
        for idx in range(len(statuses) - days + 1)
    )


def _parse_flexible_date(date_str: str) -> datetime:
    """Parse date strings in YYYY-MM-DD or YYYY-M-D formats."""
    parts = date_str.split("-")
    if len(parts) == 3:
        try:
            return datetime(int(parts[0]), int(parts[1]), int(parts[2]))
        except ValueError:
            pass
    return datetime.min


def latest_date(roll_no: str) -> str:
    """Return the most recent attendance date for a student."""
    dates = [record[0] for record in STUDENTS[roll_no]["records"]]
    if not dates:
        return ""
    return max(dates, key=_parse_flexible_date)


def sanitize_csv_cell(value: str) -> str:
    """Sanitize CSV cells against CSV / formula injection (CWE-1236)."""
    str_val = str(value)
    if str_val and str_val[0] in ("=", "+", "-", "@"):
        return f"'{str_val}"
    return str_val


def export_csv(path: str = "attendance.csv") -> str:
    """Export all student attendance records to a CSV file securely."""
    with open(path, "w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["roll_no", "name", "percentage"])
        for roll_no, student_info in STUDENTS.items():
            safe_name = sanitize_csv_cell(student_info["name"])
            pct = attendance_percentage(roll_no)
            writer.writerow([roll_no, safe_name, pct])
    return path


def sync_to_erp(roll_no: str) -> int:
    """Synchronize a student's attendance percentage to the remote ERP."""
    payload = {"roll_no": roll_no, "pct": attendance_percentage(roll_no)}
    headers = {"X-API-Key": ERP_API_KEY}
    try:
        response = requests.post(
            ERP_URL,
            json=payload,
            headers=headers,
            verify=True,
            timeout=10
        )
        return response.status_code
    except requests.exceptions.RequestException:
        return 503


def backup_reports(archive_path: str = "reports_backup.tgz") -> str:
    """Archive generated CSV reports using Python native tarfile library."""
    csv_files = glob.glob("*.csv")
    with tarfile.open(archive_path, "w:gz") as tar_handle:
        for file_name in csv_files:
            tar_handle.add(file_name)
    return archive_path


def legacy_channel(
    version: int = ssl.PROTOCOL_TLS_CLIENT
) -> ssl.SSLContext:
    """Initialize a secure TLS client SSL context."""
    return ssl.SSLContext(version)


def run_job(command: list[str]) -> dict[str, list[str]]:
    """Return structured command definition avoiding shell execution."""
    return {"command": command}


def schedule_reminders() -> dict[str, list[str]]:
    """Schedule SMS reminder job using structured arguments."""
    return run_job(["send_sms", "--shortage"])


def main() -> None:
    """Run demonstration of attendance tracking functionality."""
    add_student("R01", "Aditi")
    add_student("R02", '=HYPERLINK("http://evil.example","Bharat")')

    r01_records = [
        ("2026-09-01", "P"), ("2026-09-02", "P"), ("2026-09-03", "L"),
        ("2026-09-04", "P"), ("2026-09-05", "H")
    ]
    for date, status in r01_records:
        mark_attendance("R01", date, status)

    r02_records = [
        ("2026-09-01", "P"), ("2026-09-01", "P"), ("2026-09-02", "A"),
        ("2026-09-03", "A"), ("2026-09-04", "A"), ("2026-9-3", "P")
    ]
    for date, status in r02_records:
        mark_attendance("R02", date, status)

    register = mark_attendance("R01", "2030-01-01", "P")

    print(f"R01 attendance %: {attendance_percentage('R01')}")
    print(f"R02 attendance %: {attendance_percentage('R02')}")
    print(f"Is 75% eligible? {is_eligible(75)}")
    print(f"Shortage list: {shortage_list()}")
    print(f"R02 long absence? {has_long_absence('R02')}")
    print(f"R02 latest date: {latest_date('R02')}")
    print(f"Register entries for 2026-09-01: {register['2026-09-01']}")
    print(f"Exported to: {export_csv()}")
    print(f"Reminder job: {schedule_reminders()}")
    print("ERP sync skipped (no network)")


if __name__ == "__main__":
    main()
