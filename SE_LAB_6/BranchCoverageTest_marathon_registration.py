"""Lab 6 - test cases for BRANCH coverage of marathon_registration.py
Every if/elif/else decision is exercised both True and False."""
import pytest
from marathon_registration import entry_fee, start_wave, finisher_status


# ---------- entry_fee ----------
def test_10k_standard():
    assert entry_fee("10k", 30, False, False) == 800


@pytest.mark.parametrize("race", ["ultra", "", "marathon", "10K"])
def test_unknown_race(race):
    with pytest.raises(ValueError, match="unknown race"):
        entry_fee(race, 30, False, False)


def test_age_below_12_rejected():
    with pytest.raises(ValueError, match="too young"):
        entry_fee("5k", 11, False, False)


def test_age_exactly_12_allowed():
    assert entry_fee("5k", 12, False, False) == 500


@pytest.mark.parametrize("race", ["half", "full"])
def test_under_18_rejected_for_long_races(race):
    with pytest.raises(ValueError, match="too young for this distance"):
        entry_fee(race, 17, False, False)


@pytest.mark.parametrize("race,expected", [("half", 1200), ("full", 1800)])
def test_age_18_allowed_for_long_races(race, expected):
    assert entry_fee(race, 18, False, False) == expected


def test_under_18_allowed_for_short_races():
    assert entry_fee("10k", 15, False, False) == 800


def test_early_bird_true():
    assert entry_fee("half", 30, True, False) == 900


def test_early_bird_false():
    assert entry_fee("half", 30, False, False) == 1200


def test_age_64_no_senior_discount():
    assert entry_fee("full", 64, False, False) == 1800


def test_age_65_senior_discount():
    assert entry_fee("full", 65, False, False) == 900


def test_early_bird_and_senior_combined():
    # 800 - 200 = 600 ; 600 // 2 = 300
    assert entry_fee("10k", 70, True, False) == 300


def test_tshirt_true():
    assert entry_fee("5k", 20, False, True) == 800


def test_tshirt_false():
    assert entry_fee("5k", 20, False, False) == 500


def test_all_options_combined():
    # 1800 - 450 = 1350 ; //2 = 675 ; +300 = 975
    assert entry_fee("full", 66, True, True) == 975


# ---------- start_wave ----------
def test_first_timer_wave():
    assert start_wave(None, "full") == "D"


def test_first_timer_wave_non_full():
    assert start_wave(None, "10k") == "D"


def test_full_wave_a():
    assert start_wave(100, "full") == "A"


def test_full_wave_a_boundary():
    # 180 * 4 = 720 <= 240 * 3 = 720
    assert start_wave(180, "full") == "A"


def test_full_wave_b_just_above_a():
    assert start_wave(181, "full") == "B"


def test_full_wave_b_boundary():
    assert start_wave(240, "full") == "B"


def test_full_wave_c():
    assert start_wave(241, "full") == "C"


def test_non_full_wave_a():
    assert start_wave(60, "half") == "A"


def test_non_full_wave_a_boundary():
    assert start_wave(90, "10k") == "A"


def test_non_full_wave_b():
    assert start_wave(120, "5k") == "B"


def test_non_full_wave_c():
    assert start_wave(121, "half") == "C"


# ---------- finisher_status ----------
def test_dsq_when_checkpoint_missed():
    assert finisher_status(10, "full", 1) == "DSQ"


def test_no_dsq_when_no_checkpoint_missed():
    assert finisher_status(10, "5k", 0) == "finisher"


def test_full_within_limit():
    assert finisher_status(360, "full", 0) == "finisher"


def test_full_over_limit():
    assert finisher_status(361, "full", 0) == "DNF"


def test_half_within_limit():
    assert finisher_status(180, "half", 0) == "finisher"


def test_half_over_limit():
    assert finisher_status(181, "half", 0) == "DNF"


def test_short_race_within_limit():
    assert finisher_status(90, "10k", 0) == "finisher"


def test_short_race_over_limit():
    assert finisher_status(91, "5k", 0) == "DNF"
