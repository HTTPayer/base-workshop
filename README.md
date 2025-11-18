# Base Workshop - HTTPayer x402 Demos

Colección de scripts de demostración para el protocolo x402 (HTTP 402 Payment Required) en Base blockchain.

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Generación de Cuentas](#generación-de-cuentas)
- [Scripts de Demostración](#scripts-de-demostración)
- [Directorios de Guardado](#directorios-de-guardado)
- [Solución de Problemas](#solución-de-problemas)

## Requisitos Previos

### Node.js y npm

Este proyecto requiere Node.js (versión 18 o superior) y npm (incluido con Node.js).

**Verificar si ya tienes Node.js instalado:**

```bash
node --version
npm --version
```

**Si no tienes Node.js instalado:**

- **Windows**: Descarga el instalador desde [nodejs.org](https://nodejs.org/) y ejecútalo
- **macOS**: Usa Homebrew: `brew install node`
- **Linux**: Usa tu gestor de paquetes:

  ```bash
  # Ubuntu/Debian
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs

  # Fedora
  sudo dnf install nodejs
  ```

## Instalación

1. **Clona o descarga este repositorio**

2. **Navega al directorio del proyecto:**

   ```bash
   cd E:\Projects\httpayer\base-workshop\event1
   ```

3. **Instala las dependencias:**

   ```bash
   npm install
   ```

   Esto instalará todos los paquetes necesarios:

   - `x402-fetch` - SDK para pagos x402
   - `viem` - Biblioteca de Ethereum
   - `dotenv` - Gestión de variables de entorno
   - `typescript`, `tsx` - Soporte de TypeScript

4. **Compila el proyecto:**
   ```bash
   npm run build
   ```

## Configuración

1. **Crea un archivo `.env` basado en la plantilla:**

   ```bash
   # Unix/Mac/Linux
   cp .env.sample .env

   # Windows
   copy .env.sample .env
   ```

2. **Edita `.env` y configura tus valores:**

   ```env
   PRIVATE_KEY=tu_clave_privada_aqui
   LLM_SERVER=http://localhost:3000
   SPURO_API_URL=https://qu01n0u34hdsh6ajci1ie9trq8.ingress.akash-palmito.org
   SERVER_API_KEY=tu_server_api_key
   ```

   - **PRIVATE_KEY**: Tu clave privada de Ethereum/Base (con o sin prefijo `0x`)
     - Necesitarás USDC para pagos x402
   - **LLM_SERVER**: URL del servidor LLM desplegado (para demos con AI)
   - **SPURO_API_URL**: Endpoint de la API de Spuro para almacenamiento en Arkiv
   - **SERVER_API_KEY**: Endpoint LLM para traducción y chat

3. **Obtén USDC:**
   - **Airdrop**: Si ejecutas este proyecto durante el workshop programado de Base, los hosts proporcionarán USDC a tu dirección.
   - **Comprar USDC**: Usa cualquiera de los proveedores listados aquí para comprar USDC: [usdc.com/providers](https://latam.usdc.com/providers)

## Generación de Cuentas

Si necesitas crear nuevas cuentas de Ethereum para pruebas:

```bash
npm run generate:evm:accounts
```

Este script:

- Genera nuevas cuentas de Ethereum con claves privadas
- Guarda las cuentas en `./accounts/`
- Muestra las direcciones y claves privadas generadas

Una vez ejecutado, copia la clave privada y pégala en .env como valor para "PRIVATE_KEY".

## Scripts de Demostración

### Demo 01: Gloria AI - Solicitud GET Básica con x402

```bash
npm run demo:01
```

**¿Qué hace?**

- Realiza una solicitud GET simple a la API de Gloria AI
- Implementa pagos x402 usando `wrapFetchWithPayment`
- Decodifica y muestra los detalles de pago (monto, beneficiario, hash de transacción)
- Guarda la respuesta automáticamente en `./responses/` con timestamp

**Tecnologías clave:**

- `x402-fetch`: Wrapper de fetch habilitado para pagos
- `createSigner`: Crea un firmante para Base blockchain
- `decodeXPaymentResponse`: Decodifica headers de pago x402

**Flujo:**

1. Configura el firmante con tu `PRIVATE_KEY`
2. Envuelve `fetch` con capacidades de pago
3. Hace la solicitud - el pago se maneja automáticamente
4. Decodifica la información de pago del header `X-Payment`
5. Guarda respuesta y metadata de pago

### Demo 02: (Descripción pendiente)

```bash
npm run demo:02
```

### Demo 03: (Descripción pendiente)

```bash
npm run demo:03
```

### Demo 04: Solicitud POST con x402

```bash
npm run demo:04
```

**¿Qué hace?**

- Demuestra una solicitud POST con pagos x402
- Similar a demo_01 pero con método POST
- Guarda respuesta usando la utilidad `save_resp`

### Demo 05: Generación de Smart Money Intelligence

```bash
npm run demo:05
```

**¿Qué hace?**

- Genera análisis de "Smart Money Intelligence"
- Combina datos de múltiples fuentes (Nansen, Heurist, etc.)
- Usa LLM para crear resumen analítico
- Guarda datos estructurados en `./website/data.json`

**Estructura de salida:**

```json
{
  "summary": "Resumen generado por LLM...",
  "generated_at": "2024-01-15T10:30:00Z",
  "metadata": {
    "data_sources": ["nansen", "heurist"],
    "analysis_date": "2024-01-15"
  },
  "nansen": {
    /* datos de Nansen */
  },
  "heurist": {
    /* datos de Heurist */
  }
}
```

### Demo 06: Multi-API con HTTPayer Relay (Cross-Chain)

```bash
npm run demo:06
```

**¿Qué hace?**

- Demuestra **HTTPayer Relay** para pagos multi-cadena
- Realiza múltiples llamadas API con diferentes métodos, payloads y redes
- Orquesta un flujo de análisis completo:
  1. Obtiene datos de Smart Money de Nansen (endpoint Solana)
  2. Busca noticias relacionadas con Heurist AI (endpoint Base)
  3. Genera resumen con LLM
  4. Traduce el resumen al español
- Guarda datos combinados en `./website/data.json`

**Características clave:**

- **HTTPayer Relay**: Paga en Base mientras accedes a APIs en otras redes
- **Multi-cadena**: Nansen analiza Ethereum y Solana simultáneamente
- **Flujo de datos inteligente**: Extrae tokens de Nansen y los usa para búsqueda en Heurist
- **Traducción automática**: Convierte el análisis al español

**Payload de Relay:**

```typescript
{
  api_url: "https://target-api.com/endpoint",
  method: "POST",
  network: "base", // Red en la que quieres pagar
  data: { /* tu payload */ }
}
```

**APIs utilizadas:**

- Nansen API (Smart Money Netflow)
- Heurist AI Search (noticias cripto)
- LLM Server (/chat y /translate)

### Demo 07: Despliegue en webdb.site con Manejo de Timeout

```bash
npm run demo:07
```

**¿Qué hace?**

- Despliega contenido estático en webdb.site (almacenamiento descentralizado)
- Maneja cargas de larga duración con timeout de 120 segundos
- Implementa lógica de reintentos (3 intentos máximo) con backoff progresivo
- Muestra tamaños de archivo durante la carga
- Guarda respuesta de despliegue con URL del sitio web

**Características especiales:**

- `AbortController` para timeouts
- Reintentos automáticos en caso de fallo
- Visualización del progreso de carga
- Formato legible de tamaños de archivo (KB/MB)

### Demo 08: Guardar en Arkiv Blockchain vía Spuro SDK

```bash
npm run demo:08
```

**¿Qué hace?**

- Lee el resumen de Smart Money Intelligence de `./website/data.json` (generado por demo_05)
- Codifica el resumen como payload hexadecimal
- Lo guarda en Arkiv blockchain usando Spuro SDK
- Usa `fetchWithPay` para pagos x402 a Spuro
- Verifica el almacenamiento leyendo los datos de vuelta
- Guarda registro de entidad en `./arkiv/` para referencia futura

**Flujo detallado:**

1. Verifica que exista `./website/data.json` (ejecuta demo_05 primero si no existe)
2. Extrae `websiteData.summary` de los datos
3. Codifica a hexadecimal con `encodePayload()`
4. Llama a `createEntity()` con:
   - `fetchWithPay` - habilitado para x402
   - Payload hexadecimal
   - Atributos como strings (requerido por Arkiv)
   - TTL: 1 año (86400 \* 365 segundos)
5. Recibe `entity_key` y `tx_hash`
6. Verifica con `readEntity()`
7. Guarda registro local con toda la metadata

**Atributos guardados:**

- `generated_at`: Timestamp de generación
- `data_sources`: Fuentes de datos (como JSON string)
- `analysis_date`: Fecha del análisis
- `has_nansen_data`, `has_heurist_data`: Flags de disponibilidad de datos

**Modos de uso:**

```bash
# Modo por defecto: guardar último resumen de demo_05
npm run demo:08

# Leer entidad por clave
npm run demo:08 read <entity_key>

# Guardar datos personalizados
npm run demo:08 custom '{"mi": "dato"}'
```

**Salida:**

```
🔑 Entity Key: 0x1234...abcd
🔗 Transaction Hash: 0x5678...ef90
🔗 Spuro URL: https://qu01n0u34hdsh6ajci1ie9trq8.ingress.akash-palmito.org/entities/0x1234...abcd
💾 Entity record saved to: ./arkiv/0x1234...abcd.json
```

## Directorios de Guardado

El proyecto crea y utiliza varios directorios para guardar datos:

### `./responses/`

- **Propósito**: Almacena respuestas HTTP de las APIs con x402
- **Formato**: JSON con timestamp
- **Nombrado**: `{prefix}_{nombre}_{timestamp}.json`
- **Contiene**:
  - Cuerpo de la respuesta
  - Metadata de pago (monto, beneficiario, tx_hash)
  - Headers HTTP
  - Información de tiempo
- **Generado por**: demo_01, demo_04, demo_07, etc.
- **Ejemplo**: `demo01_gloria-ai_2024-01-15T10-30-45-123Z.json`

### `./website/`

- **Propósito**: Almacena datos estructurados para generación de sitios web
- **Archivo principal**: `data.json`
- **Generado por**: demo_05
- **Contiene**: Análisis de Smart Money Intelligence con resumen LLM
- **Usado por**: demo_08 (para guardar en Arkiv)

### `./arkiv/`

- **Propósito**: Registros locales de entidades guardadas en Arkiv blockchain
- **Formato**: JSON con entity_key como nombre de archivo
- **Generado por**: demo_08
- **Contiene**:
  - `entity_key`: Identificador único en Arkiv
  - `tx_hash`: Hash de transacción blockchain
  - `spuro_url`: URL para acceder a los datos
  - `owner`: Dirección del dueño
  - `saved_at`: Timestamp
  - `summary`: Copia del resumen guardado
- **Ejemplo**: `0x1234...abcd.json`

### `./accounts/`

- **Propósito**: Cuentas de Ethereum generadas localmente
- **Generado por**: `npm run generate:evm:accounts`
- **Formato**: JSON con dirección, clave privada, etc.
- **Seguridad**: Nunca compartas estos archivos ni los subas a Git

### `./deployments/`

- **Propósito**: Registros de despliegues (contratos, sitios web)
- **Generado por**: Scripts de despliegue
- **Contiene**: Direcciones, URLs, configuración de despliegue

### `./dist/`

- **Propósito**: Código TypeScript compilado
- **Generado por**: `npm run build`
- **No se versiona**: Excluido en `.gitignore`

### `./node_modules/`

- **Propósito**: Dependencias de npm
- **Generado por**: `npm install`
- **No se versiona**: Excluido en `.gitignore`

## Utilidades

### `scripts/utils/save_resp.ts`

Utilidad compartida para guardar respuestas HTTP con timestamp automático.

**Funciones:**

1. **`saveResponse(response, name, paymentInfo, options?)`**

   - Guarda respuesta completa con metadata
   - Incluye información de pago x402
   - Añade headers y timing

2. **`saveResponseBody(response, name, options?)`**
   - Guarda solo el cuerpo de la respuesta
   - Más ligero, para datos simples

**Opciones:**

- `dir`: Directorio personalizado (default: `./responses`)
- `prefix`: Prefijo para nombre de archivo (default: `""`)

## Solución de Problemas

### Error: "Cannot find module 'x402-fetch'"

**Solución:**

```bash
npm install
```

Asegúrate de que `tsconfig.json` tenga `"moduleResolution": "bundler"`.

### Error: "Signer type incompatible"

**Causa**: Usar `createWalletClient` de viem en lugar de `createSigner` de x402-fetch.

**Solución**: Siempre usa:

```typescript
import { createSigner } from "x402-fetch";
const signer = await createSigner("base", PRIVATE_KEY as `0x${string}`);
```

### Error: "524 Timeout" en demo_07

**Causa**: Carga muy grande o conexión lenta.

**Solución**: El script ya incluye:

- Timeout de 120 segundos
- 3 reintentos automáticos
- Backoff progresivo

Si persiste, verifica tu conexión de internet o el tamaño de los archivos a subir.

### Error: "rlp: expected input string" en demo_08

**Causa**: Atributos en Spuro deben ser strings.

**Solución**: Ya está implementado - todos los atributos se convierten:

```typescript
attributes: {
  data_sources: JSON.stringify(array),  // Arrays → JSON string
  has_data: String(boolean),             // Booleans → string
  timestamp: dateString || ""            // Strings con fallback
}
```

### Error: "No website data found" en demo_08

**Causa**: Falta el archivo `./website/data.json`.

**Solución**: Ejecuta demo_05 primero:

```bash
npm run demo:05
npm run demo:08
```

### Error: "Insufficient funds"

**Causa**: No tienes suficiente USDC (para pagos x402).

**Solución**:

1. Comprar USDC

### El script se cuelga sin error

**Posibles causas**:

1. Falta el archivo `.env`
2. `PRIVATE_KEY` inválida
3. Problemas de red

**Pasos de diagnóstico**:

```bash
# 1. Verifica que .env existe
cat .env

# 2. Verifica formato de PRIVATE_KEY (debe tener 64 caracteres hex)
# 3. Prueba con demo_01 (más simple)
npm run demo:01
```

## Recursos Adicionales

- **Documentación x402**: [GitHub x402](https://github.com/x402)
- **HTTPayer**: [GitHub HTTPayer](https://github.com/HTTPayer)
- **Spuro SDK**: API de Arkiv para almacenamiento blockchain
- **Base Network**: [docs.base.org](https://docs.base.org)
- **Viem Documentation**: [viem.sh](https://viem.sh)

## Seguridad

- **NUNCA** subas tu archivo `.env` a GitHub
- **NUNCA** uses tu wallet principal para pruebas
- El archivo `.gitignore` está configurado para proteger archivos sensibles

## Notas

- Todos los scripts usan **Base** mainnet por defecto
- Los pagos x402 son automáticos una vez configurado el firmante
- Las respuestas se guardan automáticamente con timestamps para fácil auditoría
- Spuro requiere pagos x402 para todas las operaciones (lectura y escritura)
- Arkiv blockchain proporciona almacenamiento descentralizado e inmutable

## Licencia

TBA

---

**¿Necesitas ayuda?** Abre un issue en el [repositorio de GitHub](https://github.com/HTTPayer/base-workshop).
