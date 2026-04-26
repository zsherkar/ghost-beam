from ghostbeam.memory.retrieval import retrieve_elogs


def test_diffuse_quad_query_retrieves_quad_2_incident():
    hits = retrieve_elogs("diffuse beam quad drift", top_k=3)
    assert any("quad_2 drift" in hit.title for hit in hits)


def test_rf_phase_query_retrieves_rf_incident():
    hits = retrieve_elogs("RF phase drift readback", top_k=3)
    assert any("RF phase drift" in hit.title for hit in hits)


def test_high_charge_halo_query_retrieves_charge_incident():
    hits = retrieve_elogs("high charge halo", top_k=3)
    assert any("High charge halo" in hit.title for hit in hits)


def test_bpm_noise_query_retrieves_bpm_incident():
    hits = retrieve_elogs("BPM noise", top_k=3)
    assert any("BPM noise" in hit.title or "BPM cable" in hit.title for hit in hits)
