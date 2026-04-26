from ghostbeam.diagnostics.vision import analyze_beam_image, gaussian_image


def test_centered_gaussian_label():
    result = analyze_beam_image(gaussian_image())
    assert "CENTERED" in result.labels


def test_wide_gaussian_diffuse_label():
    result = analyze_beam_image(gaussian_image(sx=0.38, sy=0.35))
    assert "DIFFUSE" in result.labels


def test_offset_gaussian_off_axis_label():
    result = analyze_beam_image(gaussian_image(cx=0.45, cy=-0.25))
    assert "OFF_AXIS" in result.labels


def test_elliptical_gaussian_astigmatic_label():
    result = analyze_beam_image(gaussian_image(sx=0.32, sy=0.12))
    assert "ASTIGMATIC" in result.labels


def test_halo_image_label():
    result = analyze_beam_image(gaussian_image(halo=True))
    assert "HALO" in result.labels


def test_clipped_image_label():
    result = analyze_beam_image(gaussian_image(cx=0.72, cy=0.72, clipped=True))
    assert "CLIPPED" in result.labels
