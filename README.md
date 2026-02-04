# TRACKY 📋

Aplicación de organización familiar con notas, listas y control de deudas compartidas.

## 🚀 Deploy a Vercel

### Paso 1: Sube a GitHub
```bash
git init
git add .
git commit -m "Initial commit - TRACKY app"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/tracky.git
git push -u origin main
```

### Paso 2: Conecta con Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New Project"
3. Importa tu repositorio de GitHub
4. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu Anon Key de Supabase
5. Click en "Deploy"

### Paso 3: Configura la URL en Supabase
1. Ve a tu proyecto Supabase → Authentication → URL Configuration
2. Agrega tu URL de Vercel a "Redirect URLs":
   - `https://tu-app.vercel.app/auth/callback`

### Paso 4: Configura Google OAuth
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. En tu proyecto → APIs & Services → Credentials
3. Edita tu OAuth 2.0 Client ID
4. Agrega a "Authorized redirect URIs":
   - `https://svflscvrfvkujpkrtphf.supabase.co/auth/v1/callback`

## 📦 Ejecutar SQL en Supabase

Antes de usar la app, ejecuta estos scripts en tu Supabase SQL Editor:

1. `supabase_schema.sql` - Tablas principales
2. `supabase_attachments.sql` - Tabla de adjuntos/fotos

## 🛠️ Desarrollo Local

```bash
npm install
npm run dev
```

La app estará en http://localhost:3000

## ✨ Características

- 📝 **Notas** - Guarda información importante
- 📋 **Listas** - Listas de compras y tareas con checkboxes
- 💰 **Deudas** - Control de quién debe qué
- 📸 **Fotos** - Adjunta fotos a cualquier entrada
- 👥 **Grupos** - Comparte con tu familia
- 🔐 **Google OAuth** - Login seguro

## 📱 Stack

- Next.js 16 (App Router)
- Supabase (Auth, Database, Storage)
- Tailwind CSS 4
- TypeScript
