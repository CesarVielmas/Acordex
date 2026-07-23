# Panel Administrador ACORDEX (`admins_web`)

Aplicación web de administración construida con **Angular 21**, **Tailwind CSS v3** y gestor de paquetes de alto rendimiento **Bun**.

## 🚀 Comandos de Inicio Rápidos con Bun

Para instalar dependencias y ejecutar la aplicación usando **Bun**:

```bash
# Navegar a la carpeta del panel administrador
cd admins_web

# Instalar dependencias con Bun
bun install

# Iniciar servidor de desarrollo en http://localhost:4201
bun start

# Compilar para producción
bun run build
```

## 🛠️ Configuración de Bun
- **Lockfile:** `bun.lock`
- **Package Manager:** `bun@1.2.18` (especificado en `package.json` y `angular.json`)
- **Puerto por Defecto:** `4201` (para evitar conflictos con `clients_web` en 4200)

## 📋 Características Principales
- **Mock Role Switcher:** Selector reactivo `[ Encargado | Administrador | Usuario ]` en el Header.
- **Persistencia LocalStorage:** Mutaciones sincronizadas en tiempo real en `localStorage`.
- **12 Paneles Interactivos:** Dashboard, Cotizaciones (10 estados + pago), Grupos (aislamiento multi-disquera), Eventos (co-producción + croquis zonal + evidencias), Firmas/Prensa, Finanzas (exclusivo Encargado), Estadísticas, Tareas (filtro de privacidad), Clientes (CRM), Usuarios & Permisos (Audit Trail), Archivos y Configuración.
