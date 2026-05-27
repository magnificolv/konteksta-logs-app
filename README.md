# 🪟 Kontekstalogas

Personīgais konteksta logs — PWA aplikācija tavu domu, ideju un uzdevumu organizēšanai.

**Web:** [konteksta-logs.app](https://magnificolv.github.io/konteksta-logs-app) *(drīzumā)*

## Iespējas

- 🎨 Krāsainas kārtis katrai dzīves jomai
- 📝 Markdown atbalsts — strukturēti ieraksti
- ☁️ Push uz GitHub (privāts repo) — backup
- ⬇️ Pull no GitHub — atjaunošana
- 📱 PWA — instalējams telefonā, strādā offline
- 🔒 Dati tavā GitHub privātajā repo — neviens cits neredz

## Kā lietot

1. Atver telefonā web versiju
2. "Add to Home Screen" — instalējas kā app
3. ⚙️ Settings → ievadi GitHub token
4. ☁️ Push → saglabā izmaiņas

## Arhitektūra

- **Šis repo:** aplikācijas kods (publisks)
- **Privāts repo:** tavs `data.json` ar kontekstu
- **Cloudflare Worker:** starpnieks starp PWA un GitHub API
