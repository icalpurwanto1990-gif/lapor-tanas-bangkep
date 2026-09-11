class DashboardController {
    renderDashboard(req, res) {
        const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Admin - Lapor Tanas Bangkep</title>
    <!-- Fonts & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="/css/dashboard.css">
</head>
<body>
    <!-- Navbar Header -->
    <nav class="navbar navbar-expand-lg navbar-dark app-navbar no-print">
        <div class="container-fluid px-4">
            <div class="d-flex align-items-center gap-3">
                <div class="brand-icon">
                    <i class="bi bi-shield-check"></i>
                </div>
                <div>
                    <h5 class="brand-title mb-0">LAPOR TANAS BANGKEP</h5>
                    <small class="brand-subtitle">Pemerintah Kabupaten Banggai Kepulauan</small>
                </div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-action-secondary" onclick="cetakLaporanSemua()">
                    <i class="bi bi-printer"></i> Cetak Rekap Laporan
                </button>
                <button class="btn btn-action-primary" onclick="muatData(true)">
                    <i class="bi bi-arrow-clockwise" id="refresh-icon"></i> Segarkan
                </button>
            </div>
        </div>
    </nav>

    <!-- Main Content Container -->
    <div class="container-fluid px-4 py-4 main-content no-print">
        
        <!-- Flash Alert Container -->
        <div id="alert-container"></div>

        <!-- 1. Statistik Cards -->
        <div class="row g-3 mb-4">
            <div class="col-xl-3 col-sm-6">
                <div class="stat-card stat-total">
                    <div class="stat-content">
                        <span class="stat-label">Total Pengaduan</span>
                        <h2 class="stat-number" id="stat-total">0</h2>
                        <span class="stat-sub">Semua laporan terarsip</span>
                    </div>
                    <div class="stat-icon"><i class="bi bi-folder2-open"></i></div>
                </div>
            </div>
            <div class="col-xl-3 col-sm-6">
                <div class="stat-card stat-pending">
                    <div class="stat-content">
                        <span class="stat-label">Menunggu Verifikasi</span>
                        <h2 class="stat-number" id="stat-pending">0</h2>
                        <span class="stat-sub">Perlu respon admin</span>
                    </div>
                    <div class="stat-icon"><i class="bi bi-clock-history"></i></div>
                </div>
            </div>
            <div class="col-xl-3 col-sm-6">
                <div class="stat-card stat-process">
                    <div class="stat-content">
                        <span class="stat-label">Sedang Diproses</span>
                        <h2 class="stat-number" id="stat-proses">0</h2>
                        <span class="stat-sub">Didisposisikan ke OPD</span>
                    </div>
                    <div class="stat-icon"><i class="bi bi-gear-wide-connected"></i></div>
                </div>
            </div>
            <div class="col-xl-3 col-sm-6">
                <div class="stat-card stat-done">
                    <div class="stat-content">
                        <span class="stat-label">Laporan Selesai</span>
                        <h2 class="stat-number" id="stat-selesai">0</h2>
                        <span class="stat-sub">Telah ditindaklanjuti</span>
                    </div>
                    <div class="stat-icon"><i class="bi bi-check2-all"></i></div>
                </div>
            </div>
        </div>

        <!-- 2. Kontrol & Filter -->
        <div class="card panel-card mb-4 border-0">
            <div class="card-body p-3 p-md-4">
                <div class="row g-3 align-items-center">
                    <div class="col-md-5 col-lg-6">
                        <div class="search-input-group">
                            <i class="bi bi-search search-icon"></i>
                            <input type="text" id="inputCari" class="form-control" placeholder="Cari nama pelapor, NIK, judul, atau nomor tiket..." onkeyup="muatData()">
                        </div>
                    </div>
                    <div class="col-md-4 col-lg-3">
                        <div class="d-flex align-items-center gap-2">
                            <i class="bi bi-funnel text-muted"></i>
                            <select id="filterStatus" class="form-select" onchange="muatData()">
                                <option value="Semua">Semua Status</option>
                                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                                <option value="Sedang Diproses">Sedang Diproses</option>
                                <option value="Selesai">Selesai</option>
                                <option value="Ditolak">Ditolak</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-3 col-lg-3 text-md-end">
                        <span class="text-muted small">
                            Menampilkan <strong id="count-terlihat">0</strong> data
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 3. Tabel Data Laporan -->
        <div class="card panel-card border-0">
            <div class="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-table text-primary fs-5"></i>
                    <h6 class="mb-0 fw-bold">Daftar Laporan Masyarakat</h6>
                </div>
                <span class="badge bg-light text-dark border" id="last-updated">Update: Barusan</span>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0 custom-table">
                        <thead>
                            <tr>
                                <th style="width: 32%;">INFORMASI PENGADUAN</th>
                                <th style="width: 24%;">IDENTITAS PELAPOR</th>
                                <th style="width: 22%;">STATUS & DISPOSISI</th>
                                <th style="width: 22%;" class="text-end">TINDAKAN</th>
                            </tr>
                        </thead>
                        <tbody id="tabel-laporan">
                            <!-- Diisi secara dinamis via dashboard.js -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </div>

    <!-- AREA KHUSUS UNTUK CETAK TABEL REKAPITULASI (PRINT ONLY) -->
    <div id="area-cetak-laporan" class="print-section" style="display: none;">
        <div class="print-header text-center">
            <h3 class="fw-bold mb-1">PEMERINTAH KABUPATEN BANGGAI KEPULAUAN</h3>
            <h4 class="mb-1">DINAS KOMUNIKASI DAN INFORMATIKA</h4>
            <p class="mb-0">REKAPITULASI LAPORAN PENGADUAN MASYARAKAT (LAPOR TANAS)</p>
            <p class="small text-muted mb-2">Tanggal Cetak: <span id="print-tgl"></span></p>
            <hr class="border-2 border-dark">
        </div>
        <table class="table table-bordered table-sm print-table">
            <thead>
                <tr>
                    <th width="4%">No</th>
                    <th width="14%">No. Tiket</th>
                    <th width="12%">Waktu</th>
                    <th width="16%">Nama Pelapor</th>
                    <th width="24%">Perihal / Judul</th>
                    <th width="14%">Status</th>
                    <th width="16%">Tujuan Disposisi</th>
                </tr>
            </thead>
            <tbody id="tabel-print-body"></tbody>
        </table>
    </div>

    <!-- MODAL 1: DISPOSISI KE OPD -->
    <div class="modal fade" id="modalDisposisi" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header bg-warning text-dark">
                    <h6 class="modal-title fw-bold"><i class="bi bi-send-fill me-1"></i> Disposisi Laporan ke OPD</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="disp_index">
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Pilih Instansi / OPD Tujuan:</label>
                        <select id="disp_opd" class="form-select">
                            <option value="Dinas Kominfo">Dinas Kominfo</option>
                            <option value="Dinas Pendidikan">Dinas Pendidikan</option>
                            <option value="Dinas Kesehatan">Dinas Kesehatan</option>
                            <option value="Dinas PUPR">Dinas PUPR</option>
                            <option value="Dinas Sosial">Dinas Sosial</option>
                            <option value="Dinas Perhubungan">Dinas Perhubungan</option>
                            <option value="Kecamatan">Kecamatan</option>
                            <option value="Desa/Kelurahan">Desa/Kelurahan</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Catatan / Instruksi Disposisi:</label>
                        <textarea id="disp_catatan" class="form-control" rows="3" placeholder="Masukkan instruksi penanganan untuk OPD terkait..."></textarea>
                    </div>
                    <div class="alert alert-warning py-2 small mb-0">
                        <i class="bi bi-info-circle me-1"></i> Sistem akan mengirimkan pesan WhatsApp otomatis ke kontak resmi OPD bersangkutan.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="button" class="btn btn-warning fw-semibold" onclick="kirimDisposisi()">Kirim Disposisi</button>
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL 2: BALAS PELAPOR -->
    <div class="modal fade" id="modalBalas" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header bg-success text-white">
                    <h6 class="modal-title fw-bold"><i class="bi bi-reply-fill me-1"></i> Kirim Tanggapan ke Pelapor</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="balas_index">
                    <div class="alert alert-info small mb-3">
                        <i class="bi bi-whatsapp me-1"></i> Pesan akan dikirimkan langsung ke nomor WhatsApp pelapor melalui Bot Lapor Tanas.
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Isi Tanggapan / Solusi:</label>
                        <textarea id="balas_pesan" class="form-control" rows="4" placeholder="Tuliskan jawaban atau hasil tindak lanjut..."></textarea>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="check_selesai" checked>
                        <label class="form-check-label fw-semibold" for="check_selesai">
                            Tandai Status Laporan sebagai "Selesai"
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="button" class="btn btn-success fw-semibold" onclick="kirimBalasan()">Kirim Tanggapan</button>
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL 3: BUKTI MEDIA -->
    <div class="modal fade" id="modalBukti" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow">
                <div class="modal-header">
                    <h6 class="modal-title fw-bold"><i class="bi bi-paperclip me-1"></i> Berkas Bukti Laporan</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center p-4">
                    <div id="bukti-container"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL 4: CETAK TIKET SATUAN -->
    <div class="modal fade" id="modalCetak" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow">
                <div class="modal-header no-print">
                    <h6 class="modal-title fw-bold"><i class="bi bi-ticket-perforated me-1"></i> Lembar Tiket Laporan</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <div id="cetakTiket" class="ticket-container p-4 bg-white border">
                        <div class="text-center mb-3">
                            <h5 class="fw-bold mb-0">PEMERINTAH KABUPATEN BANGGAI KEPULAUAN</h5>
                            <p class="small text-muted mb-0">SISTEM LAYANAN LAPOR TANAS BANGKEP</p>
                            <div class="border-bottom border-2 border-dark my-2"></div>
                        </div>
                        <div class="row g-2 mb-3">
                            <div class="col-6"><strong>Nomor Tiket:</strong> <span id="cetak_no_tiket" class="badge bg-dark"></span></div>
                            <div class="col-6 text-end"><strong>Tanggal:</strong> <span id="cetak_waktu"></span></div>
                        </div>
                        <table class="table table-bordered table-sm mb-3">
                            <tbody>
                                <tr><th width="30%" class="bg-light">Nama Pelapor</th><td id="cetak_nama"></td></tr>
                                <tr><th class="bg-light">NIK</th><td id="cetak_nik"></td></tr>
                                <tr><th class="bg-light">Jenis Laporan</th><td id="cetak_jenis"></td></tr>
                                <tr><th class="bg-light">Instansi Tujuan</th><td id="cetak_instansi"></td></tr>
                                <tr><th class="bg-light">Lokasi Kejadian</th><td id="cetak_lokasi"></td></tr>
                                <tr><th class="bg-light">Status Saat Ini</th><td id="cetak_status" class="fw-bold"></td></tr>
                            </tbody>
                        </table>
                        <h6 class="fw-bold mb-1">Rincian Laporan:</h6>
                        <div id="cetak_isi" class="p-3 bg-light border rounded mb-3" style="white-space: pre-wrap;"></div>
                        <h6 class="fw-bold mb-1">Disposisi & Catatan:</h6>
                        <p id="cetak_disposisi" class="fst-italic text-muted mb-4"></p>
                        <div class="d-flex justify-content-end mt-4">
                            <div class="text-center" style="width: 220px;">
                                <p class="mb-1">Salakan, <span id="cetak_tgl_ttd"></span></p>
                                <p class="small text-muted mb-4">Petugas Verifikator</p>
                                <br>
                                <p class="fw-bold mb-0 border-top pt-1">( Admin Lapor Tanas )</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer no-print">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    <button type="button" class="btn btn-primary" onclick="window.print()"><i class="bi bi-printer me-1"></i> Cetak Dokumen</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/js/dashboard.js"></script>
</body>
</html>`;
        res.send(html);
    }
}

module.exports = new DashboardController();
