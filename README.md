# VideoMeet - Video Konferans Uygulaması

Modern, güvenli ve kullanımı kolay bir video konferans web uygulaması. React, TypeScript, WebRTC ve Supabase ile geliştirilmiştir.

## Özellikler

### Kimlik Doğrulama
- ✅ Email/Şifre ile kayıt ve giriş
- ✅ Google OAuth2 entegrasyonu
- ✅ Güvenli oturum yönetimi

### Video Konferans
- ✅ HD kalitesinde video ve ses aktarımı
- ✅ Gerçek zamanlı peer-to-peer bağlantı (WebRTC)
- ✅ Çoklu katılımcı desteği
- ✅ Responsive video grid düzeni

### Kontroller
- ✅ Kamera açma/kapatma
- ✅ Mikrofon açma/kapatma
- ✅ Ekran paylaşımı
- ✅ Toplantıdan ayrılma

### Kayıt Özelliği
- ✅ Yerel ekran kaydı (MediaRecorder API)
- ✅ Otomatik .webm formatında indirme
- ✅ Gerçek zamanlı kayıt süresi göstergesi

### Oda Yönetimi
- ✅ Yeni oturum başlatma (benzersiz 6 haneli kod)
- ✅ Oda kodu ile oturuma katılma
- ✅ Oda kodunu panoya kopyalama

## Teknoloji Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS
- **Authentication:** Supabase Auth (Email + Google OAuth2)
- **Database:** Supabase (PostgreSQL)
- **Video/Audio:** WebRTC + PeerJS
- **Recording:** MediaRecorder API
- **Icons:** Lucide React

## Kurulum

### 1. Projeyi Klonlayın veya İndirin

```bash
git clone [repository-url]
cd project
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Supabase Kurulumu

#### a) Supabase Projesi Oluşturun
1. [Supabase](https://supabase.com) hesabı açın
2. Yeni bir proje oluşturun
3. Project Settings > API bölümünden:
   - `Project URL` (VITE_SUPABASE_URL)
   - `anon/public` key (VITE_SUPABASE_ANON_KEY)
   değerlerini alın

#### b) Environment Variables
`.env` dosyası zaten mevcut, değerlerin doğru olduğundan emin olun:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### c) Database Kurulumu
1. Supabase Dashboard'da SQL Editor'ü açın
2. `database-setup.sql` dosyasının içeriğini kopyalayıp çalıştırın
3. Bu script şunları oluşturur:
   - `profiles` tablosu
   - `rooms` tablosu
   - `room_participants` tablosu
   - Gerekli RLS (Row Level Security) politikaları
   - Trigger fonksiyonları

#### d) Google OAuth2 Kurulumu (Opsiyonel)
1. Supabase Dashboard > Authentication > Providers
2. Google provider'ı aktif edin
3. Google Cloud Console'dan OAuth2 credentials alın
4. Callback URL'i kaydedin: `https://your-project.supabase.co/auth/v1/callback`

### 4. Uygulamayı Çalıştırın

```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışacaktır.

## Kullanım

### 1. Kayıt Olma / Giriş Yapma
- Email ve şifre ile kayıt olun veya
- Google hesabınızla giriş yapın

### 2. Yeni Toplantı Başlatma
- Ana sayfada "Start New Session" butonuna tıklayın
- Otomatik olarak 6 haneli bir oda kodu oluşturulur
- Oda kodunu diğer katılımcılarla paylaşın

### 3. Toplantıya Katılma
- "Join Meeting" bölümüne 6 haneli oda kodunu girin
- "Join Session" butonuna tıklayın

### 4. Toplantı Sırasında
- **Mikrofon:** Ses açma/kapatma
- **Kamera:** Video açma/kapatma
- **Ekran Paylaşımı:** Ekranınızı paylaşın
- **Kayıt:** Toplantıyı kaydedin (yerel olarak indirilir)
- **Oda Kodu Kopyala:** Kodu panoya kopyalayın
- **Ayrıl:** Toplantıdan çıkın

## Mimari

### WebRTC Bağlantısı
- PeerJS kullanılarak basitleştirilmiş WebRTC implementasyonu
- STUN sunucuları ile NAT traversal
- Peer discovery için oda kodu bazlı sistem

### Güvenlik
- Row Level Security (RLS) ile veritabanı güvenliği
- Supabase Auth ile güvenli kimlik doğrulama
- HTTPS üzerinden şifrelenmiş iletişim

### State Management
- React Context API (Authentication)
- Custom hooks (WebRTC, Recording)
- Local state management

## Önemli Notlar

### Tarayıcı Desteği
- Chrome, Firefox, Safari (son versiyonlar)
- HTTPS gereklidir (localhost hariç)
- Kamera ve mikrofon izni gereklidir

### Kayıt Özelliği
- Kayıtlar sadece kullanıcının kendi bilgisayarına indirilir
- .webm formatında kaydedilir
- Ekran paylaşımı + ses kaydedilir

### Performans
- Video kalitesi otomatik ayarlanır
- Maksimum 9 katılımcı önerilir
- Bant genişliği kullanımı katılımcı sayısına göre artar

## Geliştirme

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Type Check
```bash
npm run typecheck
```

## Sorun Giderme

### Kamera/Mikrofon Çalışmıyor
- Tarayıcı izinlerini kontrol edin
- HTTPS bağlantısı kullanın
- Cihazların başka bir uygulama tarafından kullanılmadığından emin olun

### WebRTC Bağlantı Hatası
- Internet bağlantınızı kontrol edin
- Firewall ayarlarını kontrol edin
- STUN/TURN sunucu yapılandırmasını gözden geçirin

### Kayıt Çalışmıyor
- Tarayıcının MediaRecorder API'yi desteklediğinden emin olun
- Ekran paylaşımı izni verin
- Yeterli disk alanı olduğundan emin olun

## Lisans

MIT

## Destek

Sorular veya sorunlar için issue açabilirsiniz.
