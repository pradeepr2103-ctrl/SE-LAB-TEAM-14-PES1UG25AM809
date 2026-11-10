"""Lab 6 - test cases for LINE (code) coverage of marathon_registration.py"""
import pytest
from marathon_registration import entry_fee, start_wave, finisher_status


# ---------- entry_fee ----------
def test_10k_standard():
    assert entry_fee("10k", 30, False, False) == 800


def test_unknown_race():
    with pytest.raises(ValueError, match="unknown race"):
        entry_fee("ultra", 30, False, False)


def test_too_young_overall():
    with pytest.raises(ValueError, match="too young"):
        entry_fee("5k", 11, False, False)


def test_too_young_for_distance():
    with pytest.raises(ValueError, match="too young for this distance"):
        entry_fee("full", 17, False, False)


def test_early_bird_discount():
    # 1200 - 300 = 900
    assert entry_fee("half", 30, True, False) == 900


def test_senior_discount():
    # 1800 // 2 = 900
    assert entry_fee("full", 65, False, False) == 900


def test_tshirt_added():
    assert entry_fee("5k", 20, False, True) == 800


# ---------- start_wave ----------
def test_first_timer_wave():
    assert start_wave(None, "full") == "D"


def test_wave_a_full():
    assert start_wave(100, "full") == "A"


def test_wave_b_full():
    assert start_wave(200, "full") == "B"


def test_wave_c_non_full():
    assert start_wave(150, "10k") == "C"


# ---------- finisher_status ----------
def test_dsq_missed_checkpoint():
    assert finisher_status(100, "full", 1) == "DSQ"


def test_full_finisher():
    assert finisher_status(300, "full", 0) == "finisher"


def test_half_dnf():
    assert finisher_status(200, "half", 0) == "DNF"


def test_short_race_finisher():
    assert finisher_status(60, "10k", 0) == "finisher"
