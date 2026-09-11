/**
 * Dashboard Admin - Lapor Tanas Bangkep
 * Script Interaktif Frontend
 */

let dataLaporanGlobal = [];
let modalDisp, modalBalas, modalBukti, modalCetak;

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    modalDisp = new bootstrap.Modal(document.getElementById('modalDisposisi'));
    modalBalas = new bootstrap.Modal(document.getElementById('modalBalas'));
    modalBukti = new bootstrap.Modal(document.getElementById('modalBukti'));
    modalCetak = new bootstrap.Modal(document.getElementById('modalCetak'));

    muatData();

    // Auto-refresh data setiap 10 detik
    setInterval(() => {
        muatData(false);
    }, 10000);
});

function showAlert(message, type = 'success') {
    const container = document.getElementById('alert-container');
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
            <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    container.innerHTML = alertHtml;
    setTimeout(() => {
        const el = document.getElementById(alertId);
        if (el) {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(el);
            bsAlert.close();
        }
    }, 4000);
}

// Mengambil data dari API dan memperbarui tampilan
async function muatData(showSpin = false) {
    const refreshIcon = document.getElementById('refresh-icon');
    if (showSpin && refreshIcon) {
        refreshIcon.classList.add('spin-animation');
    }

    try {
        const response = await fetch('/api/laporan');
        if (!response.ok) throw new Error('Gagal memuat data dari server');

        const data = await response.json();
        dataLaporanGlobal = data;

        // 1. Update Statistik
        const total = data.length;
        const pending = data.filter(d => d.status === 'Menunggu Verifikasi').length;
        const proses = data.filter(d => d.status === 'Sedang Diproses').length;
        const selesai = data.filter(d => d.status === 'Selesai').length;

        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-pending').innerText = pending;
        document.getElementById('stat-proses').innerText = proses;
        document.getElementById('stat-selesai').innerText = selesai;

        // 2. Filter & Pencarian
        const kataKunci = (document.getElementById('inputCari').value || '').toLowerCase().trim();
        const statusTerpilih = document.getElementById('filterStatus').value;

        const dataFilter = data.filter(item => {
            const nama = (item.nama || '').toLowerCase();
            const nik = (item.nik || '').toLowerCase();
            const tiket = (item.no_tiket || '').toLowerCase();
            const judul = (item.judul || '').toLowerCase();
            const instansi = (item.instansi || '').toLowerCase();

            const matchKeyword = 
                !kataKunci || 
                nama.includes(kataKunci) || 
                nik.includes(kataKunci) || 
                tiket.includes(kataKunci) || 
                judul.includes(kataKunci) || 
                instansi.includes(kataKunci);

            const matchStatus = (statusTerpilih === 'Semua' || item.status === statusTerpilih);

            return matchKeyword && matchStatus;
        });

        document.getElementById('count-terlihat').innerText = dataFilter.length;

        // 3. Render Tabel
        const tbody = document.getElementById('tabel-laporan');
        if (dataFilter.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                        Tidak ada laporan yang sesuai dengan filter atau kata kunci.
                    </td>
                </tr>
            `;
        } else {
            let html = '';
            dataFilter.forEach((item) => {
                const asliIndex = data.indexOf(item);

                let badgeClass = 'menunggu';
                let iconClass = 'bi-hourglass-split';
                if (item.status === 'Sedang Diproses') {
                    badgeClass = 'proses';
                    iconClass = 'bi-gear-fill';
                } else if (item.status === 'Selesai') {
                    badgeClass = 'selesai';
                    iconClass = 'bi-check-circle-fill';
                } else if (item.status === 'Ditolak') {
                    badgeClass = 'ditolak';
                    iconClass = 'bi-x-circle-fill';
                }

                const btnBukti = item.isMedia
                    ? `<button class="btn btn-outline-primary btn-action-sm me-1" onclick="lihatBukti(${asliIndex})" title="Lihat Bukti Foto/Dokumen">
                         <i class="bi bi-paperclip"></i> Bukti
                       </button>`
                    : `<button class="btn btn-light btn-action-sm text-muted me-1" disabled title="Tidak ada lampiran">
                         <i class="bi bi-dash"></i> Bukti
                       </button>`;

                const disposisiText = item.disposisi 
                    ? `<span class="text-primary fw-medium"><i class="bi bi-arrow-right-short"></i> ${escapeHtml(item.disposisi.opd)}</span>`
                    : `<span class="text-muted fst-italic">Belum didisposisikan</span>`;

                html += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="badge-ticket">#${escapeHtml(item.no_tiket || '-')}</span>
                            <span class="badge bg-light text-secondary border small">${escapeHtml(item.jenis || 'Laporan')}</span>
                        </div>
                        <div class="fw-bold text-dark mb-1">${escapeHtml(item.judul || 'Tanpa Judul')}</div>
                        <div class="small text-muted text-truncate" style="max-width: 320px;" title="${escapeHtml(item.isi || '')}">
                            ${escapeHtml(item.isi || '-')}
                        </div>
                        <div class="small text-secondary mt-1">
                            <i class="bi bi-clock me-1"></i>${escapeHtml(item.waktu || '-')}
                        </div>
                    </td>
                    <td>
                        <div class="fw-semibold text-dark">${escapeHtml(item.nama || '-')}</div>
                        <div class="small text-muted"><i class="bi bi-person-vcard me-1"></i>NIK: ${escapeHtml(item.nik || '-')}</div>
                        <div class="small text-muted"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(item.lokasi || item.alamat || '-')}</div>
                        <div class="small text-muted"><i class="bi bi-telephone me-1"></i>${escapeHtml(item.kontak || '-')}</div>
                    </td>
                    <td>
                        <div class="mb-2">
                            <span class="badge-status ${badgeClass}">
                                <i class="bi ${iconClass}"></i> ${escapeHtml(item.status || 'Menunggu')}
                            </span>
                        </div>
                        <div class="small">
                            <strong>Disposisi:</strong> ${disposisiText}
                        </div>
                    </td>
                    <td class="text-end">
                        <div class="d-flex flex-wrap justify-content-end gap-1">
                            ${btnBukti}
                            <button class="btn btn-outline-dark btn-action-sm" onclick="lihatCetak(${asliIndex})" title="Cetak Lembar Tiket">
                                <i class="bi bi-printer"></i> Tiket
                            </button>
                            <button class="btn btn-outline-warning btn-action-sm text-dark" onclick="bukaDisposisi(${asliIndex})" title="Teruskan ke OPD">
                                <i class="bi bi-send"></i> Disposisi
                            </button>
                            <button class="btn btn-outline-success btn-action-sm" onclick="bukaBalas(${asliIndex})" title="Kirim Balasan via WhatsApp">
                                <i class="bi bi-reply"></i> Balas
                            </button>
                            <button class="btn btn-outline-danger btn-action-sm" onclick="hapusLaporan(${asliIndex})" title="Hapus Laporan">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            });
            tbody.innerHTML = html;
        }

        const now = new Date();
        document.getElementById('last-updated').innerText = `Update: ${now.toLocaleTimeString('id-ID')}`;

    } catch (err) {
        console.error('Error saat memuat data:', err);
    } finally {
        if (showSpin && refreshIcon) {
            refreshIcon.classList.remove('spin-animation');
        }
    }
}

// Pratinjau Bukti Gambar / Dokumen
function lihatBukti(index) {
    const item = dataLaporanGlobal[index];
    if (!item) return;

    const container = document.getElementById('bukti-container');
    if (item.isMedia && item.buktiPath) {
        if (item.mimetype && item.mimetype.includes('image')) {
            container.innerHTML = `
                <img src="${item.buktiPath}" class="img-fluid rounded shadow-sm border" style="max-height: 500px;" alt="Bukti Laporan">
                <div class="mt-3">
                    <a href="${item.buktiPath}" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-arrows-fullscreen me-1"></i> Buka Ukuran Penuh
                    </a>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="py-4">
                    <i class="bi bi-file-earmark-arrow-down fs-1 text-primary d-block mb-3"></i>
                    <h6>Dokumen Lampiran Tersedia</h6>
                    <a href="${item.buktiPath}" target="_blank" class="btn btn-primary mt-2">
                        <i class="bi bi-download me-1"></i> Unduh Berkas Lampiran
                    </a>
                </div>
            `;
        }
    } else {
        container.innerHTML = `<p class="text-muted my-3">Tidak ada berkas bukti lampiran.</p>`;
    }
    modalBukti.show();
}

// Pratinjau Cetak Lembar Tiket
function lihatCetak(index) {
    const item = dataLaporanGlobal[index];
    if (!item) return;

    document.getElementById('cetak_no_tiket').innerText = item.no_tiket || '-';
    document.getElementById('cetak_waktu').innerText = item.waktu || '-';
    document.getElementById('cetak_nama').innerText = item.nama || '-';
    document.getElementById('cetak_nik').innerText = item.nik || '-';
    document.getElementById('cetak_jenis').innerText = item.jenis || '-';
    document.getElementById('cetak_instansi').innerText = item.instansi || '-';
    document.getElementById('cetak_lokasi').innerText = item.lokasi || item.alamat || '-';
    document.getElementById('cetak_status').innerText = item.status || '-';
    document.getElementById('cetak_isi').innerText = item.isi || '-';

    const disposisiText = item.disposisi 
        ? `Didisposisikan ke: ${item.disposisi.opd} | Catatan: ${item.disposisi.catatan || '-'}`
        : 'Belum ada catatan disposisi.';
    document.getElementById('cetak_disposisi').innerText = disposisiText;

    const tglSekarang = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('cetak_tgl_ttd').innerText = tglSekarang;

    modalCetak.show();
}

// Buka Modal Disposisi
function bukaDisposisi(index) {
    document.getElementById('disp_index').value = index;
    document.getElementById('disp_catatan').value = '';
    modalDisp.show();
}

// Kirim Disposisi ke Server
async function kirimDisposisi() {
    const index = document.getElementById('disp_index').value;
    const opd = document.getElementById('disp_opd').value;
    const catatan = document.getElementById('disp_catatan').value;

    try {
        const response = await fetch(`/api/laporan/disposisi/${index}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ opd, catatan })
        });

        const result = await response.json();
        if (result.success) {
            modalDisp.hide();
            showAlert(`Laporan berhasil didisposisikan ke <strong>${escapeHtml(opd)}</strong>`, 'success');
            muatData();
        } else {
            alert('Gagal mendisposisikan: ' + (result.message || 'Error tidak diketahui'));
        }
    } catch (e) {
        console.error(e);
        alert('Gagal menghubungi server');
    }
}

// Buka Modal Balas
function bukaBalas(index) {
    document.getElementById('balas_index').value = index;
    document.getElementById('balas_pesan').value = '';
    document.getElementById('check_selesai').checked = true;
    modalBalas.show();
}

// Kirim Balasan ke WhatsApp Pelapor
async function kirimBalasan() {
    const index = document.getElementById('balas_index').value;
    const pesan = document.getElementById('balas_pesan').value.trim();
    const selesai = document.getElementById('check_selesai').checked;

    if (!pesan) {
        alert('Silakan tuliskan tanggapan terlebih dahulu!');
        return;
    }

    try {
        const response = await fetch(`/api/laporan/balas/${index}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pesan, selesai })
        });

        const result = await response.json();
        if (result.success) {
            modalBalas.hide();
            showAlert('Tanggapan berhasil dikirimkan langsung ke WhatsApp pelapor!', 'success');
            muatData();
        } else {
            alert('Gagal mengirim balasan: ' + (result.message || 'Error tidak diketahui'));
        }
    } catch (e) {
        console.error(e);
        alert('Gagal menghubungi server');
    }
}

// Hapus Laporan
async function hapusLaporan(index) {
    const item = dataLaporanGlobal[index];
    const nama = item ? item.nama : 'laporan ini';

    if (confirm(`Apakah Anda yakin ingin menghapus data pengaduan dari "${nama}" secara permanen?`)) {
        try {
            const response = await fetch(`/api/laporan/${index}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (result.success) {
                showAlert('Data laporan berhasil dihapus.', 'success');
                muatData();
            } else {
                alert('Gagal menghapus: ' + (result.message || 'Error'));
            }
        } catch (e) {
            console.error(e);
            alert('Gagal menghubungi server saat menghapus data');
        }
    }
}

// Cetak Semua Laporan Sesuai Filter
function cetakLaporanSemua() {
    const kataKunci = (document.getElementById('inputCari').value || '').toLowerCase().trim();
    const statusTerpilih = document.getElementById('filterStatus').value;

    const dataFilter = dataLaporanGlobal.filter(item => {
        const nama = (item.nama || '').toLowerCase();
        const nik = (item.nik || '').toLowerCase();
        const tiket = (item.no_tiket || '').toLowerCase();
        const matchKeyword = !kataKunci || nama.includes(kataKunci) || nik.includes(kataKunci) || tiket.includes(kataKunci);
        const matchStatus = (statusTerpilih === 'Semua' || item.status === statusTerpilih);
        return matchKeyword && matchStatus;
    });

    document.getElementById('print-tgl').innerText = new Date().toLocaleString('id-ID');

    let html = '';
    if (dataFilter.length === 0) {
        html = `<tr><td colspan="7" class="text-center py-3">Tidak ada data untuk dicetak.</td></tr>`;
    } else {
        dataFilter.forEach((item, idx) => {
            html += `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td><strong>${escapeHtml(item.no_tiket || '-')}</strong></td>
                    <td>${escapeHtml(item.waktu || '-')}</td>
                    <td>${escapeHtml(item.nama || '-')}</td>
                    <td>${escapeHtml(item.judul || '-')}</td>
                    <td>${escapeHtml(item.status || '-')}</td>
                    <td>${escapeHtml(item.disposisi ? item.disposisi.opd : '-')}</td>
                </tr>
            `;
        });
    }

    document.getElementById('tabel-print-body').innerHTML = html;
    window.print();
}

function escapeHtml(string) {
    if (!string) return '';
    return String(string)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
