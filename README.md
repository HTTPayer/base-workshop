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

```bash
 git clone https://github.com/HTTPayer/base-workshop
```

2. **Navega al directorio del proyecto:**

   ```bash
   cd path-to-project
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
   LLM_SERVER=https://api.httpayer.com/llm
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

### Demo 02: HTTPayer Relay - Misma Cadena con Privacidad

```bash
npm run demo:02
```

**¿Qué hace?**

- Demuestra **HTTPayer Relay** para pagos que preservan la privacidad
- Realiza una solicitud POST a Heurist AI Search a través del relay
- Paga en Base mientras accede a la API de Heurist (también en Base)
- Muestra cómo el relay oculta tu dirección de wallet de la API destino

**Características clave:**

- **Preserva privacidad**: La API destino no ve tu dirección de wallet
- **HTTPayer Relay**: Intermediario que maneja el reenvío de pagos
- **Búsqueda impulsada por IA**: Busca "últimos avances en motores de búsqueda impulsados por IA"
- **Flujo de dos pasos**: Primera llamada obtiene instrucciones de pago (402), segunda llamada paga y obtiene datos

**Payload de Relay:**

```typescript
{
  api_url: "https://mesh.heurist.xyz/x402/agents/ExaSearchDigestAgent/exa_web_search",
  method: "POST",
  network: "base",
  data: {
    search_term: "latest advancements in AI-powered search engines",
    limit: 5,
    time_filter: "past_week",
    include_domains: ["https://hackernoon.com"]
  }
}
```

**Flujo:**

1. Llamar al relay sin pago → Recibir 402 Payment Required
2. Extraer instrucciones de pago de la respuesta
3. Hacer el pago con `wrapFetchWithPayment`
4. Recibir resultados de búsqueda de Heurist AI

### Demo 03: HTTPayer Relay - Cross-Chain (Base → Solana)

```bash
npm run demo:03
```

**¿Qué hace?**

- Demuestra capacidades **cross-chain** de HTTPayer Relay
- Paga con USDC en blockchain **Base**
- Accede a **Jupiter API** en **Solana** (agregador DEX)
- Obtiene una cotización para intercambiar 0.02 SOL → USDC

**Características clave:**

- **Pago cross-chain**: Paga en una cadena, accede a API en otra
- **Integración con Jupiter**: Principal agregador DEX de Solana
- **Caso de uso DeFi real**: Obtén cotizaciones de swap sin tener wallet de Solana fondeada
- **Abstracción de red**: El cliente solo necesita USDC en Base

**Payload de Relay:**

```typescript
{
  api_url: "https://jupiter.api.corbits.dev/ultra/v1/order",
  method: "GET",
  network: "base", // Paga en Base
  params: {
    inputMint: "So11111111111111111111111111111111111111112", // SOL
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    amount: "20000000", // 0.02 SOL
    taker: "corzHctjX9Wtcrkfxz3Se8zdXqJYCaamWcQA7vwKF7Q"
  }
}
```

**Por qué esto importa:**

- **No necesitas wallet de Solana**: Accede a APIs de Solana sin SOL para gas
- **Método de pago unificado**: Usa USDC en Base para todas las llamadas API
- **Composabilidad cross-chain**: Construye apps que abarquen múltiples blockchains
- **Eficiencia de costos**: No necesitas hacer bridge de activos o mantener balances en múltiples cadenas

### Demo 04: API de Nansen Smart Money Netflow - Cross-Chain (Base → Solana)

```bash
npm run demo:04
```

**¿Qué hace?**

- Obtiene datos de **Smart Money Netflow** de Nansen Analytics
- Rastrea flujos de tokens de inversores institucionales ("Fund", "Smart Trader")
- Analiza cadenas de **Ethereum** y **Solana** simultáneamente
- Usa HTTPayer Relay para pago cross-chain

**Características clave:**

- **Acceso a datos premium**: La API de Nansen típicamente requiere suscripción costosa
- **Análisis multi-cadena**: Obtén datos para Ethereum y Solana en una llamada
- **Rastreo de smart money**: Ve qué tokens están acumulando/vendiendo fondos y traders inteligentes
- **Pago por uso**: Solo paga por los datos que realmente solicitas

**Solicitud API:**

```typescript
{
  api_url: "https://nansen.api.corbits.dev/api/v1/smart-money/netflow",
  method: "POST",
  network: "base",
  data: {
    chains: ["ethereum", "solana"],
    filters: {
      include_smart_money_labels: ["Fund", "Smart Trader"],
      exclude_smart_money_labels: ["30D Smart Trader"],
      include_native_tokens: false,
      include_stablecoins: false
    },
    pagination: { page: 1, per_page: 10 }
  }
}
```

**Datos de respuesta:**

- Símbolos de tokens y direcciones de contratos
- Flujo neto (USD) en períodos de 7d, 30d
- Conteo de wallets de smart money
- Sectores y categorías de tokens
- Datos específicos por cadena

### Demo 05: API de Ejecución de Código E2B

```bash
npm run demo:05
```

**¿Qué hace?**

- Demuestra **ejecución de código remoto** usando la API E2B (Execute to Build)
- Ejecuta fragmentos de código Python en un entorno sandbox seguro
- Guarda automáticamente los resultados de ejecución con metadata de pago

**Características clave:**

- **Ejecución segura**: Ejecuta código no confiable en sandbox aislado
- **Soporte Python**: Ejecuta fragmentos de Python y obtén resultados
- **Pago por ejecución**: Solo paga cuando ejecutas código

**Solicitud API:**

```typescript
{
  api_url: "https://echo.router.merit.systems/resource/e2b/execute",
  method: "POST",
  network: "base",
  data: {
    snippet: 'print("Hello World!")'
  }
}
```

**Casos de uso:**

- Probar fragmentos de código sin configuración local
- Ejecutar trabajos de cómputo bajo demanda
- Ejecutar scripts de procesamiento de datos
- Construir funciones Python serverless

**La respuesta incluye:**

- Resultado/salida de ejecución
- Cualquier error o excepción
- Metadata de ejecución

### Demo 06: Orquestación Multi-API con LLM y Traducción

```bash
npm run demo:06
```

**¿Qué hace?**

- Orquesta **4 llamadas API** en secuencia para generar Smart Money Intelligence
- Demuestra capacidades avanzadas de HTTPayer Relay
- Pipeline de análisis completo:
  1. **API de Nansen Smart Money**: Obtiene datos de flujo neto de tokens (Ethereum & Solana)
  2. **Heurist AI Search**: Encuentra artículos de noticias cripto relacionadas
  3. **API LLM Chat**: Genera análisis comprensivo
  4. **API LLM Translate**: Traduce el análisis al español
- Guarda resultados como archivos markdown y datos JSON

**Características clave:**

- **Flujo multi-API**: Encadena múltiples APIs de pago juntas
- **Flujo de datos inteligente**: Extrae tokens de Nansen, los alimenta a la consulta de búsqueda de Heurist
- **Análisis impulsado por IA**: El LLM sintetiza datos en insights accionables
- **Traducción automática**: Versión en español generada automáticamente
- **Múltiples formatos de salida**:
  - `./output/demo06_original_*.md` - Markdown en inglés
  - `./output/demo06_translated_*.md` - Markdown en español
  - `./website/data.json` - Datos estructurados completos

**Flujo completo:**

```
1. Nansen API → Flujos de smart money para tokens ETH/SOL
2. Extraer símbolos de tokens → Construir consulta de búsqueda de Heurist
3. Heurist Search → Artículos de noticias cripto relacionadas
4. LLM Chat → Analizar tendencias y generar resumen
5. LLM Translate → Versión en español
6. Guardar → Archivos markdown + datos JSON
```

**APIs utilizadas:**

- Nansen API (Smart Money Netflow) - Analítica multi-cadena
- Heurist AI Search (ExaSearch) - Agregación de noticias cripto
- LLM Server (/chat) - Análisis GPT-4
- LLM Server (/translate) - Traducción al español

### Demo 07: Guardar en Arkiv Blockchain vía Spuro SDK

```bash
npm run demo:07
```

**¿Qué hace?**

- Lee el resumen de Smart Money Intelligence de `./website/data.json` (generado por demo_06)
- Codifica el resumen como payload hexadecimal
- Lo guarda en **Arkiv blockchain** usando Spuro SDK
- Usa `fetchWithPay` para pagos x402 a Spuro
- Verifica el almacenamiento leyendo los datos de vuelta
- Guarda registro de entidad en `./arkiv/` para referencia futura

**Flujo detallado:**

1. Verifica que exista `./website/data.json` (ejecuta demo_06 primero si no existe)
2. Extrae `websiteData.summary` de los datos
3. Codifica a hexadecimal con `encodePayload()`
4. Llama a `createEntity()` con:
   - `fetchWithPay` - habilitado para x402
   - Payload hexadecimal
   - Atributos como strings (requerido por Arkiv)
   - TTL: 1 año (86400 × 365 segundos)
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
# Modo por defecto: guardar último resumen de demo_06
npm run demo:07

# Leer entidad por clave
npm run demo:07 read <entity_key>

# Guardar datos personalizados
npm run demo:07 custom '{"mi": "dato"}'
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
- **Generado por**: demo_01, demo_02, demo_03, demo_04, demo_05, demo_06
- **Ejemplo**: `demo01_gloria-ai_2024-01-15T10-30-45-123Z.json`

### `./output/`

- **Propósito**: Almacena archivos de salida formateados (markdown, reportes)
- **Formato**: Markdown (.md) con timestamp
- **Generado por**: demo_06
- **Contiene**:
  - `demo06_original_*.md` - Análisis de Smart Money Intelligence en inglés
  - `demo06_translated_*.md` - Traducción al español
- **Características**: Formato markdown limpio para fácil lectura y compartición
- **Ejemplo**: `demo06_original_2024-01-15T10-30-45.md`

### `./website/`

- **Propósito**: Almacena datos estructurados para generación de sitios web
- **Archivo principal**: `data.json`
- **Generado por**: demo_06
- **Contiene**: Análisis de Smart Money Intelligence con resumen LLM
- **Usado por**: demo_07 (para guardar en Arkiv)

### `./arkiv/`

- **Propósito**: Registros locales de entidades guardadas en Arkiv blockchain
- **Formato**: JSON con entity_key como nombre de archivo
- **Generado por**: demo_07
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

### Error: "rlp: expected input string" en demo_07

**Causa**: Atributos en Spuro deben ser strings.

**Solución**: Ya está implementado - todos los atributos se convierten:

```typescript
attributes: {
  data_sources: JSON.stringify(array),  // Arrays → JSON string
  has_data: String(boolean),             // Booleans → string
  timestamp: dateString || ""            // Strings con fallback
}
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
