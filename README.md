<p align="center">
  <img src="Store-Assets/icon128.png" width="96" height="96" alt="GitHub Project Start Date Logo">
</p>

<h1 align="center">GitHub Project Start Date</h1>

<p align="center">
  <b>A lightweight, privacy-focused browser extension that displays the exact creation date of any GitHub repository.</b>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/github-project-start-date/bapokklneigobdjnklligmbcekfhienj" target="_blank">
    <img src="https://img.shields.io/badge/Chrome_Web_Store-Add_to_Chrome-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Available in Chrome Web Store">
  </a>
  &nbsp;&nbsp;
  <a href="https://addons.mozilla.org/addon/github-project-start-date/" target="_blank">
    <img src="https://img.shields.io/badge/Firefox_Add--ons-Add_to_Firefox-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white" alt="Available on Firefox Add-ons">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v1.2-2ea44f?style=flat-square" alt="Version v1.2">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Browsers-Chrome%20%7C%20Brave%20%7C%20Edge%20%7C%20Firefox-orange?style=flat-square" alt="Browsers">
  <img src="https://img.shields.io/badge/License-MIT-purple?style=flat-square" alt="License">
</p>

---

## 🎬 Demo / Nasıl Çalışır?

<p align="center">
  <img src="demo.gif" width="850" alt="GitHub Project Start Date Tutorial Demo" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
</p>

> 📹 *Higher quality WebM video is also available in the repository: [`Animation.webm`](Animation.webm)*

---

## 📖 Overview / Genel Bakış

Have you ever browsed an open-source project and wondered: *"When was this repository first created?"*

**GitHub Project Start Date** answers that question instantly. It injects the initial repository start date with a sleek animated gradient into two convenient locations:
1. 🏷️ **Repository Header Bar:** Right next to the `Public` / `Private` repository visibility badge.
2. 📌 **About Sidebar:** Directly below topic tags and repo description in the right sidebar.

You can also view it anytime by clicking the extension icon in your browser toolbar!

Açık kaynak bir projeyi incelerken *"Bu proje tam olarak ne zaman başladı?"* diye merak ettiyseniz, bu eklenti reponun oluşturulma tarihini hem **üst başlık çubuğuna** (`Public/Private` etiketinin yanına) hem de sağdaki **About** bölümüne animasyonlu şekilde ekler!

---

## 🚀 Official Stores / Resmî Mağazalar

Eklentiyi mağazalardan doğrudan tek tıkla kurabilirsiniz:

| Tarayıcı (Browser) | Mağaza Bağlantısı (Store Link) | Durum |
| :--- | :--- | :--- |
| **Chrome / Brave / Edge / Opera** | [**Chrome Web Store'dan Yükle**](https://chromewebstore.google.com/detail/github-project-start-date/bapokklneigobdjnklligmbcekfhienj) | ![Chrome](https://img.shields.io/badge/Chrome_Web_Store-v1.2_Available-4285F4?style=flat-square&logo=googlechrome&logoColor=white) |
| **Mozilla Firefox** | [**Firefox Add-ons'tan Yükle (AMO)**](https://addons.mozilla.org/addon/github-project-start-date/) | ![Firefox](https://img.shields.io/badge/Firefox_Add--ons-v1.2_Approved-FF7139?style=flat-square&logo=firefoxbrowser&logoColor=white) |

---

## ✨ Features / Özellikler

- 📌 **Dual In-Page Placement:** Displays start date both in the repository header bar (next to the Public/Private tag) and inside the *About* sidebar.
- 🛡️ **Private Repositories Supported:** Works seamlessly on your private repositories without requiring authentication or personal access tokens.
- ⚡ **Zero API Rate Limits:** Reads page metadata locally, completely bypassing GitHub's 60 req/hour API rate limit.
- 🔄 **Turbo / SPA Navigation:** Automatically adapts to GitHub's Turbo Drive page transitions with a resilient 5-second polling retry system.
- 🪟 **Toolbar Popup:** Click the extension icon to view repository start date in a modern dark-mode card.
- 🚀 **Manifest V3:** Built with the latest WebExtension Manifest V3 standard for speed, security, and low memory footprint.
- 🖤 **Official Classic GitHub Branding:** Clean, crisp official icons from 16x16 to 128x128.

---

## 📝 Changelog / Sürüm Geçmişi

### 🌟 v1.2 (Latest / Güncel)
- 🚀 **Dual In-Page Placement:** Added repository start date badge directly into the repository header bar next to Public/Private tag.
- 🎯 **Sidebar Targeting Improvements:** Enhanced About sidebar insertion, topic tags detection, and legacy BorderGrid fallbacks.
- 🔄 **Resilient SPA Polling:** Added a 5-second interval retry system to guarantee date rendering across GitHub Turbo, PJAX, and client-side soft navigations.
- 🦊 **Firefox Add-ons Optimization:** Added Gecko `data_collection_permissions` settings for full Manifest V3 compliance.

### 📦 v1.1
- 🦊 **Firefox Add-ons (AMO):** Official approval and public release on addons.mozilla.org.
- 🌐 **Chrome Web Store:** Initial store release for Chromium browsers.
- 🎨 **Store Assets:** Added promotional banners, showcase graphics, and animated demo assets.

### 🎉 v1.0
- 🚀 Initial release.
- 📅 View repository creation date in GitHub sidebar and toolbar popup.

---

## 🛠️ Manuel Kurulum Rehberi (Adım Adım / Step-by-Step)

Mağazayı beklemeden veya yerel geliştirme için eklentiyi manuel olarak da yükleyebilirsiniz:

### 🌐 Chrome / Brave / Edge / Opera İçin Kurulum:

1. Bu repodaki yeşil **Code -> Download ZIP** butonuna bas veya [Releases](https://github.com/MustafaEsatTemel/Github-Project-Start-Date/releases) sayfasından `Github-Project-Start-Date-Chrome.zip` dosyasını indir.
2. İndirdiğin zip dosyasını bir klasöre çıkart (içinde `Github-Project-Start-Date-Chrome` klasörünü göreceksin).
3. Tarayıcının uzantılar sayfasını aç:
   * **Chrome:** `chrome://extensions`
   * **Brave:** `brave://extensions`
   * **Edge:** `edge://extensions`
4. Sayfanın sağ üst köşesindeki **"Geliştirici Modu" (Developer Mode)** anahtarını aç.
5. Sol üstte beliren **"Paketlenmemiş öğe yükle" (Load unpacked)** butonuna tıkla.
6. Klasör seçici penceresinden **`Github-Project-Start-Date-Chrome`** klasörünü seç ve onayla.
7. 🎉 **Hazır!** Herhangi bir GitHub reposuna girdiğinde üst barda ve About bölümünde başlangıç tarihini göreceksin.

---

### 🦊 Firefox İçin Kurulum:

1. [Releases](https://github.com/MustafaEsatTemel/Github-Project-Start-Date/releases) sayfasından `Github-Project-Start-Date-Firefox.zip` dosyasını indir veya repoyu klonla.
2. Firefox'ta adres çubuğuna şunu yazıp Enter'a bas:
   ```text
   about:debugging#/runtime/this-firefox
   ```
3. **"Geçici Eklenti Yükle..." (Load Temporary Add-on...)** butonuna tıkla.
4. `Github-Project-Start-Date-main-Firefox` klasörünün içindeki **`manifest.json`** dosyasını seç.
5. 🎉 Eklenti hemen aktif hale gelir!

---

## 🔒 Privacy & Permissions / Gizlilik İlkeleri

- **Zero Data Collection:** We do not collect, track, or sell any user data.
- **Local Sandbox Execution:** 100% of the logic runs locally inside your browser.
- **Minimal Permissions:** Only uses `github.com` and `api.github.com` strictly to retrieve creation timestamps.
- 📄 Detaylı gizlilik politikası için: **[PRIVACY.md](PRIVACY.md)**

---

## 📂 Project Structure / Proje Yapısı

```text
├── Github-Project-Start-Date-Chrome/         # Chrome / Brave / Edge Manifest V3 eklentisi (v1.2)
│   ├── manifest.json
│   ├── content.js
│   ├── popup.html / popup.js / style.css
│   └── Images/                               # 16, 32, 48, 128px orijinal ikonlar
├── Github-Project-Start-Date-main-Firefox/   # Firefox Manifest V3 eklentisi (v1.2)
├── Store-Assets/                             # Mağaza vitrin görselleri (1280x800 & 440x280)
├── Animation.webm                            # Yüksek kaliteli orijinal eğitim videosu
├── demo.gif                                  # README için optimize edilmiş canlı demo (1.8MB)
├── Github-Project-Start-Date-Chrome.zip      # Yayına hazır güncel Chrome paketi (v1.2)
├── Github-Project-Start-Date-Firefox.zip     # Yayına hazır güncel Firefox paketi (v1.2)
├── PRIVACY.md                                # Resmi gizlilik politikası
├── LICENSE                                   # MIT Açık Kaynak Lisansı
└── README.md                                 # Dokümantasyon
```

---

## 👨‍💻 Author / Geliştirici

Created with ❤️ by **[Mustafa Esat Temel](https://github.com/MustafaEsatTemel)**

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
