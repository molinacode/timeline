import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =====================================================
// SCRIPT PARA CAMBIAR ENTRE MODO LOCAL Y SUPABASE
// =====================================================

const FRONTEND_PATH = join(__dirname, '../frontend/src');
const SUPABASE_CLIENT_PATH = join(FRONTEND_PATH, 'supabase_client.ts');

// Configuraciones para cada modo
const CONFIGS = {
    local: {
        name: 'Modo Local',
        description: 'Usa API REST local + SQLite',
        supabaseClient: `import { createClient } from '@supabase/supabase-js';

// Modo Local - Usar API REST local
const supabaseUrl = 'http://localhost:3001/api';
const supabaseAnonKey = 'local-api-key';

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Modo local activado. Usando API REST local.');
    // Crear cliente demo que usa la API local
    supabase = {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async ({ email, password }) => {
                const response = await fetch('http://localhost:3001/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                return { data: { user: data.user, session: { access_token: data.token } }, error: data.error };
            },
            signUp: async ({ email, password }) => {
                const response = await fetch('http://localhost:3001/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                return { data: { user: data.user, session: { access_token: data.token } }, error: data.error };
            },
            signOut: async () => {
                const response = await fetch('http://localhost:3001/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: localStorage.getItem('token') })
                });
                localStorage.removeItem('token');
                return { error: null };
            }
        },
        from: () => ({
            select: () => Promise.resolve({ data: [], error: null }),
            insert: () => Promise.resolve({ error: { message: 'Modo local - usar API REST' } })
        })
    };
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };`
    },
    
    supabase: {
        name: 'Modo Supabase',
        description: 'Usa Supabase Cloud + PostgreSQL',
        supabaseClient: `import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config/supabase';

// Modo Supabase - Usar Supabase Cloud
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_CONFIG.url;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey;

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing. Using demo mode.');
    // Crear cliente demo que no hace llamadas reales
    supabase = {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: () => Promise.resolve({ error: { message: 'Demo mode - Supabase not configured' } }),
            signUp: () => Promise.resolve({ error: { message: 'Demo mode - Supabase not configured' } }),
            signOut: () => Promise.resolve({ error: null })
        },
        from: () => ({
            select: () => Promise.resolve({ data: [], error: null }),
            insert: () => Promise.resolve({ error: { message: 'Demo mode - Supabase not configured' } })
        })
    };
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };`
    }
};

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

function switchToMode(mode) {
    try {
        console.log(`🔄 Cambiando a ${CONFIGS[mode].name}...`);
        console.log(`📝 ${CONFIGS[mode].description}`);
        
        // Actualizar supabase_client.ts
        fs.writeFileSync(SUPABASE_CLIENT_PATH, CONFIGS[mode].supabaseClient);
        
        // Crear archivo de configuración si no existe
        const configPath = join(FRONTEND_PATH, 'config/supabase.ts');
        if (!fs.existsSync(configPath)) {
            const configDir = dirname(configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            const supabaseConfig = `// Configuración de Supabase
export const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-supabase-anon-key'
};

// Para usar Supabase:
// 1. Crea un proyecto en https://supabase.com
// 2. Copia la URL y la clave anónima
// 3. Actualiza los valores arriba
// 4. O configura las variables de entorno:
//    VITE_SUPABASE_URL=tu-url
//    VITE_SUPABASE_ANON_KEY=tu-clave`;
            
            fs.writeFileSync(configPath, supabaseConfig);
        }
        
        console.log(`✅ Cambiado exitosamente a ${CONFIGS[mode].name}`);
        
        if (mode === 'local') {
            console.log('\\n📋 Para usar el modo local:');
            console.log('   1. Asegúrate de que el backend esté corriendo (npm run dev en backend/)');
            console.log('   2. El frontend se conectará a http://localhost:3001/api');
            console.log('   3. La base de datos será SQLite local');
        } else {
            console.log('\\n📋 Para usar el modo Supabase:');
            console.log('   1. Configura las variables de entorno:');
            console.log('      VITE_SUPABASE_URL=tu-url-supabase');
            console.log('      VITE_SUPABASE_ANON_KEY=tu-clave-supabase');
            console.log('   2. O edita frontend/src/config/supabase.ts');
        }
        
    } catch (error) {
        console.error('❌ Error al cambiar de modo:', error);
        process.exit(1);
    }
}

function showCurrentMode() {
    try {
        const content = fs.readFileSync(SUPABASE_CLIENT_PATH, 'utf8');
        
        if (content.includes('Modo Local')) {
            console.log('🏠 Modo actual: LOCAL');
            console.log('📝 Usando API REST local + SQLite');
        } else if (content.includes('Modo Supabase')) {
            console.log('☁️ Modo actual: SUPABASE');
            console.log('📝 Usando Supabase Cloud + PostgreSQL');
        } else {
            console.log('❓ Modo actual: DESCONOCIDO');
        }
        
    } catch (error) {
        console.error('❌ Error al leer configuración actual:', error);
    }
}

function showHelp() {
    console.log('📋 Comandos disponibles:');
    console.log('  node switch-mode.js local     - Cambiar a modo local');
    console.log('  node switch-mode.js supabase  - Cambiar a modo Supabase');
    console.log('  node switch-mode.js status    - Mostrar modo actual');
    console.log('  node switch-mode.js help      - Mostrar esta ayuda');
    console.log('');
    console.log('📖 Descripción de modos:');
    console.log('  🏠 LOCAL    - API REST local + SQLite (para entrega)');
    console.log('  ☁️ SUPABASE - Supabase Cloud + PostgreSQL (para desarrollo)');
}

// =====================================================
// MANEJO DE ARGUMENTOS
// =====================================================

const command = process.argv[2];

switch (command) {
    case 'local':
        switchToMode('local');
        break;
    case 'supabase':
        switchToMode('supabase');
        break;
    case 'status':
        showCurrentMode();
        break;
    case 'help':
    case '--help':
    case '-h':
        showHelp();
        break;
    default:
        console.log('❌ Comando no reconocido');
        showHelp();
        break;
}
