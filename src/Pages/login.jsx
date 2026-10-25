import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Halaman Login — Sistem Manajemen Rumah Sakit
 * -----------------------------------------------
 * 3 role: pasien, petugas, dokter.
 * Field form berubah sesuai role yang dipilih.
 *
 * CARA PAKAI DI PROYEK ASLI:
 * 1. Pastikan komponen ini dirender di dalam <BrowserRouter> (lihat App.jsx),
 *    karena useNavigate() hanya bisa dipakai di dalam konteks Router.
 * 2. Ganti bagian di dalam `handleSubmit` yang bertanda TODO dengan
 *    pemanggilan API backend lu yang sesungguhnya (fetch/axios ke /api/login).
 * 3. Setelah API berhasil, simpan token (localStorage/Context), lalu kode
 *    ini akan otomatis redirect ke dashboard sesuai role lewat
 *    `navigate(DASHBOARD_PATH[activeRole])`.
 * 4. Sesuaikan path di object DASHBOARD_PATH kalau nama route dashboard
 *    lu berbeda dari /dashboard/pasien, /dashboard/petugas, /dashboard/dokter.
 */

const ROLES = [
  {
    id: "pasien",
    label: "Pasien",
    idLabel: "NIK",
    idPlaceholder: "Masukkan NIK 16 digit",
    helper: "Masuk untuk lihat jadwal periksa, rekam medis, dan hasil lab.",
  },
  {
    id: "petugas",
    label: "Petugas",
    idLabel: "ID Pegawai",
    idPlaceholder: "Contoh: PTG-00231",
    helper: "Masuk untuk kelola pendaftaran, jadwal, dan data pasien.",
  },
  {
    id: "dokter",
    label: "Dokter",
    idLabel: "No. STR",
    idPlaceholder: "Contoh: 4021012345678",
    helper: "Masuk untuk lihat jadwal praktik dan rekam medis pasien.",
  },
];

const DASHBOARD_PATH = {
  pasien: "/dashboard/pasien",
  petugas: "/dashboard/petugas",
  dokter: "/dashboard/dokter",
};

export default function Login() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState("pasien");
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const role = ROLES.find((r) => r.id === activeRole);

  function handleRoleChange(id) {
    setActiveRole(id);
    setErrors({});
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const next = {};
    if (!form.identifier.trim()) {
      next.identifier = `${role.idLabel} wajib diisi`;
    } else if (role.id === "pasien" && !/^\d{16}$/.test(form.identifier.trim())) {
      next.identifier = "NIK harus terdiri dari 16 digit angka";
    }
    if (!form.password) {
      next.password = "Kata sandi wajib diisi";
    } else if (form.password.length < 6) {
      next.password = "Kata sandi minimal 6 karakter";
    }
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      // TODO: ganti bagian ini dengan pemanggilan API asli, contoh:
      //
      // const res = await fetch("/api/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ role: activeRole, ...form }),
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.message);
      // localStorage.setItem("token", data.token);
      // localStorage.setItem("role", activeRole);

      await new Promise((resolve) => setTimeout(resolve, 900)); // simulasi request ke backend

      // Redirect otomatis ke dashboard sesuai role yang dipilih
      navigate(DASHBOARD_PATH[activeRole]);
    } catch {
      setErrors({ form: "Login gagal. Periksa kembali data lu." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, button:focus-visible {
          outline: 2px solid #2F8F7E;
          outline-offset: 2px;
        }
        .role-btn { transition: background-color .15s ease, color .15s ease; }
      `}</style>

      <div style={styles.card}>
        {/* Panel kiri — identitas */}
        <div style={styles.leftPanel}>
          <div>
            <div style={styles.crossMark} aria-hidden="true">
              <span style={styles.crossV} />
              <span style={styles.crossH} />
            </div>
            <h1 style={styles.brandTitle}>RS Wijaya Husada</h1>
            <p style={styles.brandSubtitle}>
              Portal terpadu untuk pasien, petugas, dan dokter — satu pintu
              masuk untuk seluruh layanan rumah sakit.
            </p>
          </div>

          <div style={styles.quoteBlock}>
            <p style={styles.quoteText}>
              "Rekam medis, jadwal, dan pendaftaran, semua dalam satu sistem
              yang sama."
            </p>
          </div>
        </div>

        {/* Panel kanan — form */}
        <div style={styles.rightPanel}>
          <div style={styles.formWrap}>
            <h2 style={styles.formTitle}>Masuk ke akun lu</h2>
            <p style={styles.formSubtitle}>Pilih peran, lalu masukkan data akun.</p>

            {/* Role selector */}
            <div style={styles.roleTabs} role="tablist" aria-label="Pilih peran">
              {ROLES.map((r) => {
                const active = r.id === activeRole;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className="role-btn"
                    onClick={() => handleRoleChange(r.id)}
                    style={{
                      ...styles.roleTab,
                      ...(active ? styles.roleTabActive : {}),
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            <p style={styles.roleHelper}>{role.helper}</p>

            <form onSubmit={handleSubmit} noValidate>
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="identifier">
                    {role.idLabel}
                  </label>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    value={form.identifier}
                    onChange={handleChange}
                    placeholder={role.idPlaceholder}
                    style={{
                      ...styles.input,
                      ...(errors.identifier ? styles.inputError : {}),
                    }}
                    aria-invalid={!!errors.identifier}
                    aria-describedby={errors.identifier ? "identifier-error" : undefined}
                  />
                  {errors.identifier && (
                    <p id="identifier-error" style={styles.errorText}>
                      {errors.identifier}
                    </p>
                  )}
                </div>

                <div style={styles.field}>
                  <label style={styles.label} htmlFor="password">
                    Kata sandi
                  </label>
                  <div style={styles.passwordWrap}>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Masukkan kata sandi"
                      style={{
                        ...styles.input,
                        ...(errors.password ? styles.inputError : {}),
                        paddingRight: 72,
                      }}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? "password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={styles.showBtn}
                    >
                      {showPassword ? "Sembunyikan" : "Lihat"}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" style={styles.errorText}>
                      {errors.password}
                    </p>
                  )}
                </div>

                {errors.form && <p style={styles.errorText}>{errors.form}</p>}

                <button type="submit" style={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? "Memproses..." : `Masuk sebagai ${role.label}`}
                </button>

                <a href="#lupa-sandi" style={styles.forgotLink}>
                  Lupa kata sandi?
                </a>
              </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F4F7F6",
    fontFamily: "'Manrope', sans-serif",
    padding: "24px",
  },
  card: {
    display: "flex",
    width: "100%",
    maxWidth: 920,
    minHeight: 560,
    background: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(15, 52, 46, 0.12)",
    flexWrap: "wrap",
  },
  leftPanel: {
    flex: "1 1 320px",
    background: "#12352F",
    color: "#EAF3F0",
    padding: "48px 40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minWidth: 280,
  },
  crossMark: {
    position: "relative",
    width: 28,
    height: 28,
    marginBottom: 28,
  },
  crossV: {
    position: "absolute",
    left: "50%",
    top: 0,
    width: 4,
    height: 28,
    background: "#5FBFA9",
    transform: "translateX(-50%)",
    borderRadius: 2,
  },
  crossH: {
    position: "absolute",
    top: "50%",
    left: 0,
    height: 4,
    width: 28,
    background: "#5FBFA9",
    transform: "translateY(-50%)",
    borderRadius: 2,
  },
  brandTitle: {
    fontFamily: "'Source Serif 4', serif",
    fontSize: 28,
    fontWeight: 700,
    margin: "0 0 12px 0",
    lineHeight: 1.25,
  },
  brandSubtitle: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#BFD8D1",
    margin: 0,
    maxWidth: 320,
  },
  quoteBlock: {
    borderTop: "1px solid rgba(255,255,255,0.15)",
    paddingTop: 20,
  },
  quoteText: {
    fontFamily: "'Source Serif 4', serif",
    fontSize: 16,
    fontStyle: "italic",
    color: "#DCEDE8",
    lineHeight: 1.6,
    margin: 0,
  },
  rightPanel: {
    flex: "1 1 360px",
    padding: "48px 40px",
    display: "flex",
    alignItems: "center",
    minWidth: 300,
  },
  formWrap: {
    width: "100%",
    maxWidth: 360,
    margin: "0 auto",
  },
  formTitle: {
    fontFamily: "'Source Serif 4', serif",
    fontSize: 24,
    fontWeight: 700,
    color: "#132A25",
    margin: "0 0 6px 0",
  },
  formSubtitle: {
    fontSize: 14,
    color: "#5C6B67",
    margin: "0 0 24px 0",
  },
  roleTabs: {
    display: "flex",
    background: "#EEF3F1",
    borderRadius: 10,
    padding: 4,
    gap: 4,
    marginBottom: 12,
  },
  roleTab: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "9px 10px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "#5C6B67",
    cursor: "pointer",
    fontFamily: "'Manrope', sans-serif",
  },
  roleTabActive: {
    background: "#12352F",
    color: "#FFFFFF",
  },
  roleHelper: {
    fontSize: 13,
    color: "#5C6B67",
    margin: "0 0 24px 0",
    lineHeight: 1.5,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#132A25",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 8,
    border: "1px solid #D7E1DE",
    fontSize: 14,
    fontFamily: "'Manrope', sans-serif",
    color: "#132A25",
    background: "#FBFDFC",
  },
  inputError: {
    borderColor: "#C0533B",
  },
  passwordWrap: {
    position: "relative",
  },
  showBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#2F8F7E",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    padding: "4px 6px",
  },
  errorText: {
    color: "#C0533B",
    fontSize: 12,
    marginTop: 6,
  },
  submitBtn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: "none",
    background: "#12352F",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
    fontFamily: "'Manrope', sans-serif",
  },
  forgotLink: {
    display: "block",
    textAlign: "center",
    marginTop: 16,
    fontSize: 13,
    color: "#2F8F7E",
    textDecoration: "none",
  },
  successBox: {
    background: "#EEF6F3",
    border: "1px solid #BFE0D5",
    borderRadius: 10,
    padding: 20,
  },
  successTitle: {
    margin: "0 0 6px 0",
    fontWeight: 700,
    color: "#12352F",
    fontSize: 15,
  },
  successText: {
    margin: "0 0 14px 0",
    fontSize: 13,
    color: "#374942",
    lineHeight: 1.5,
  },
  linkBtn: {
    border: "none",
    background: "transparent",
    color: "#2F8F7E",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
  },
};