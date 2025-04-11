
---

# Guía Completa: De Web App a PWA empaquetada como APK usando TWA y Bubblewrap

Esta guía detalla paso a paso cómo convertir una aplicación web (HTML, CSS, JS) en una Progressive Web App (PWA) y empaquetarla como un APK para Android mediante Trusted Web Activity (TWA) usando Bubblewrap. La guía también incluye cómo generar y usar un keystore para firmar el APK.

---

## 1. Convertir tu aplicación web en una PWA

### 1.1. Crear el Web Manifest

Crea un archivo llamado `manifest.json` en la raíz de tu proyecto. Ejemplo:

```json
{
  "name": "Mi PWA",
  "short_name": "MiApp",
  "start_url": "https://tudominio.com/index.html",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "https://tudominio.com/icon/lowres.webp",
      "sizes": "48x48",
      "type": "image/webp"
    },
    {
      "src": "https://tudominio.com/icon/hd_hi.ico",
      "sizes": "72x72 96x96 128x128 256x256"
    }
  ]
}
```

> **Nota:** Asegúrate de que las URLs sean absolutas (especialmente en producción) y que apunten correctamente a los recursos.

### 1.2. Registrar un Service Worker

Crea un archivo `sw.js` con contenido similar a:

```js
// sw.js
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('mi-app-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles.css',
        '/script.js'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
```

Y regístralo en tu archivo JavaScript principal (por ejemplo, en `script.js`):

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
         console.log('Service Worker registrado con éxito:', registration.scope);
      })
      .catch(error => {
         console.error('Error al registrar el Service Worker:', error);
      });
  });
}
```

### 1.3. Verifica tu PWA

Utiliza herramientas como [Lighthouse](https://developers.google.com/web/tools/lighthouse/) o [PWABuilder](https://www.pwabuilder.com/) para asegurarte de que tu app cumple los requisitos de una PWA y es instalable.

---

## 2. Empaquetar la PWA como APK usando Bubblewrap

### 2.1. Instalar Node.js y Bubblewrap

1. **Instalar Node.js:**  
   Se recomienda usar una versión estable (por ejemplo, Node.js 16) para evitar problemas de compatibilidad.  
   Si es necesario, usa [nvm-windows](https://github.com/coreybutler/nvm-windows) para gestionar versiones de Node.js.

2. **Instalar Bubblewrap globalmente:**

   ```bash
   npm install -g @bubblewrap/cli
   ```

### 2.2. Crear el archivo twa-manifest.json

Crea un archivo llamado `twa-manifest.json` en la raíz de tu proyecto con la siguiente estructura (modifica los valores según tu app):

```json
{
  "packageId": "app.tudominio.twa",
  "host": "tudominio.com",
  "name": "MiPWAApp",
  "launcherName": "MiApp",
  "display": "standalone",
  "themeColor": "#000000",
  "backgroundColor": "#FFFFFF",
  "enableNotifications": true,
  "startUrl": "/index.html",
  "iconUrl": "https://tudominio.com/icon.png",
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "path": "E:\\ruta\\a\\tu\\android.keystore",
    "alias": "android"
  },
  "appVersionName": "1",
  "appVersionCode": 1,
  "shortcuts": [],
  "generatorApp": "bubblewrap-cli",
  "webManifestUrl": "https://tudominio.com/manifest.json",
  "fallbackType": "customtabs",
  "minSdkVersion": 21,
  "orientation": "default"
}
```

> **Nota:** Asegúrate de que la ruta del keystore use barras dobles (`\\`) y que no tenga espacios en la ruta (o usa rutas que eviten problemas de espacios).

### 2.3. Configurar Bubblewrap

Crea o edita el archivo `config.json` (ubicado en la raíz o en la carpeta de Bubblewrap) para que apunte a tus herramientas sin espacios. Ejemplo:

```json
{
  "jdkPath": "C:\\Android\\.bubblewrap\\jdk\\jdk-17.0.11+9",
  "androidSdkPath": "C:\\Android\\.bubblewrap\\android_sdk"
}
```

> **Importante:** Usa rutas sin espacios o configúralas de manera consistente para evitar conflictos.

### 2.4. Inicializar el proyecto TWA

Ejecuta en la raíz de tu proyecto:

```bash
bubblewrap init --manifest twa-manifest.json
```

Sigue las instrucciones que te ofrece Bubblewrap para configurar el proyecto TWA.

### 2.5. Construir el APK

Ejecuta:

```bash
bubblewrap build
```

Si todo está configurado correctamente, se generará el APK. Si el proceso de build falla o genera un APK sin firma, puedes optar por firmarlo manualmente.

---

## 3. Firmar manualmente el APK

Si el APK generado no está firmado, sigue estos pasos:

### 3.1. Generar un keystore (si aún no lo tienes)

Si necesitas regenerar el keystore, abre una terminal y ejecuta:

```bash
keytool -genkeypair -v -keystore "E:\\ruta\\a\\tu\\android.keystore" -alias android -keyalg RSA -keysize 2048 -validity 10000
```

Sigue las instrucciones y asegúrate de anotar la contraseña utilizada (en nuestro ejemplo, usaremos `NNlTRZW2eK`).

### 3.2. Firmar el APK con apksigner

Desde PowerShell, usa el operador `&` para ejecutar el comando:

```powershell
& "C:\Android\.bubblewrap\android_sdk\build-tools\34.0.0\apksigner.bat" sign --ks "E:\ruta\a\tu\android.keystore" --ks-key-alias android --ks-pass pass:NNlTRZW2eK --key-pass pass:NNlTRZW2eK --out "E:\ruta\de\salida\app-release-signed.apk" "E:\ruta\del\APK\app-release-unsigned.apk"
```

Asegúrate de reemplazar las rutas:
- `"E:\ruta\a\tu\android.keystore"`: con la ubicación de tu keystore.
- `"E:\ruta\de\salida\app-release-signed.apk"`: con la ruta de salida deseada para el APK firmado.
- `"E:\ruta\del\APK\app-release-unsigned.apk"`: con la ruta del APK sin firmar generado por el build.

### 3.3. Verificar la firma del APK

Para confirmar que el APK está firmado correctamente, ejecuta:

```powershell
& "C:\Android\.bubblewrap\android_sdk\build-tools\34.0.0\apksigner.bat" verify "E:\ruta\de\salida\app-release-signed.apk"
```

Si el comando no muestra errores, la firma es válida.

---

## 4. Probar y Publicar

1. **Probar el APK:**  
   Instala el APK firmado en un dispositivo Android o en un emulador para confirmar que la PWA funcione correctamente.

2. **Publicar en Google Play:**  
   Una vez validada, sigue el proceso de publicación en Google Play Console. Asegúrate de cumplir con las políticas de Google Play y de que el APK esté firmado con la clave correcta.

---

## 5. Notas Adicionales

- **Variables de entorno:** Asegúrate de que la variable `ANDROID_HOME` apunte a la raíz de tu Android SDK (por ejemplo, `C:\Android\.bubblewrap\android_sdk`).
- **Rutas sin espacios:** Evita rutas con espacios o configura correctamente las variables de entorno para prevenir problemas.
- **Uso de sdkmanager:** Si necesitas actualizar o instalar componentes adicionales (como build-tools o plataformas), usa:
  ```powershell
  .\sdkmanager.bat --sdk_root="C:\Android\.bubblewrap\android_sdk" "build-tools;34.0.0" "platforms;android-35"
  ```
- **Depuración:** Si encuentras errores durante el build, utiliza las opciones `--info` o `--debug` en Gradle para obtener más información.

---