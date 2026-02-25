import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =====================================================
// SCRIPT DE MODO (SOLO LOCAL)
// =====================================================

const FRONTEND_PATH = join(__dirname, '../frontend/src');
const SUPABASE_CLIENT_PATH = join(FRONTEND_PATH, 'supabase_client.ts');

// No hay modos múltiples; mantenemos script para compatibilidad

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

function switchToMode(_mode) {
    try {
        console.log('🔄 Forzando modo LOCAL (único modo soportado)...');
        console.log('📝 Usando API REST local + SQLite');
        // No reescribimos el cliente local: ya está implementado en frontend/src/supabase_client.ts
        
        // Crear archivo de configuración si no existe
        const configPath = join(FRONTEND_PATH, 'config/supabase.ts');
        if (!fs.existsSync(configPath)) {
            const configDir = dirname(configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            const supabaseConfig = `// Placeholder de configuración (Supabase eliminado). Se mantiene por compatibilidad.`;
            
            fs.writeFileSync(configPath, supabaseConfig);
        }
        
        console.log('✅ Modo LOCAL activo');
        console.log('\n📋 Pasos:');
        console.log('   1. Backend: npm run dev (carpeta backend/)');
        console.log('   2. Frontend: npm run dev (carpeta frontend/)');
        console.log('   3. La app usa http://localhost:3001/api para autenticación');
        
    } catch (error) {
        console.error('❌ Error al cambiar de modo:', error);
        process.exit(1);
    }
}

function showCurrentMode() {
    try {
        const content = fs.readFileSync(SUPABASE_CLIENT_PATH, 'utf8');
        
        if (content.includes('export const SUPABASE_CONFIG') || content.includes('export { supabase }')) {
            console.log('🏠 Modo actual: LOCAL');
            console.log('📝 Usando API REST local + SQLite');
        } else {
            console.log('❓ Modo actual: DESCONOCIDO');
        }
        
    } catch (error) {
        console.error('❌ Error al leer configuración actual:', error);
    }
}

function showHelp() {
    console.log('📋 Comandos disponibles:');
    console.log('  node switch-mode.js local     - Forzar modo local (único)');
    console.log('  node switch-mode.js status    - Mostrar modo actual');
    console.log('  node switch-mode.js help      - Mostrar esta ayuda');
    console.log('');
    console.log('📖 Descripción de modos:');
    console.log('  🏠 LOCAL    - API REST local + SQLite');
}

// =====================================================
// MANEJO DE ARGUMENTOS
// =====================================================

const command = process.argv[2];

switch (command) {
    case 'local':
        switchToMode('local');
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
