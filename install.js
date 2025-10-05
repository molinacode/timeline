#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =====================================================
// SCRIPT DE INSTALACIÓN AUTOMÁTICA
// =====================================================

console.log('🚀 TimeLine RSS Aggregator - Instalación Automática');
console.log('====================================================');

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function runCommand(command, cwd = process.cwd()) {
    try {
        console.log(`📦 Ejecutando: ${command}`);
        execSync(command, { 
            cwd, 
            stdio: 'inherit',
            encoding: 'utf8'
        });
        return true;
    } catch (error) {
        console.error(`❌ Error ejecutando: ${command}`);
        console.error(error.message);
        return false;
    }
}

function checkNodeVersion() {
    try {
        const version = execSync('node --version', { encoding: 'utf8' }).trim();
        const majorVersion = parseInt(version.substring(1).split('.')[0]);
        
        if (majorVersion < 18) {
            console.error('❌ Node.js 18+ es requerido. Versión actual:', version);
            console.error('   Por favor, actualiza Node.js desde https://nodejs.org');
            process.exit(1);
        }
        
        console.log(`✅ Node.js ${version} detectado`);
        return true;
    } catch (error) {
        console.error('❌ Node.js no está instalado');
        console.error('   Por favor, instala Node.js desde https://nodejs.org');
        process.exit(1);
    }
}

function createEnvFile() {
    const backendEnvPath = join(__dirname, 'backend/.env');
    const envExamplePath = join(__dirname, 'backend/env.example');
    
    if (!fs.existsSync(backendEnvPath) && fs.existsSync(envExamplePath)) {
        try {
            fs.copyFileSync(envExamplePath, backendEnvPath);
            console.log('✅ Archivo .env creado desde env.example');
            console.log('📝 Edita backend/.env con tus configuraciones');
        } catch (error) {
            console.warn('⚠️ No se pudo crear .env:', error.message);
        }
    }
}

// =====================================================
// INSTALACIÓN PASO A PASO
// =====================================================

async function install() {
    try {
        // 1. Verificar Node.js
        console.log('\\n🔍 Verificando Node.js...');
        checkNodeVersion();
        
        // 2. Instalar dependencias del backend
        console.log('\\n📦 Instalando dependencias del backend...');
        if (!runCommand('npm install', join(__dirname, 'backend'))) {
            throw new Error('Error instalando dependencias del backend');
        }
        
        // 3. Instalar dependencias del frontend
        console.log('\\n📦 Instalando dependencias del frontend...');
        if (!runCommand('npm install', join(__dirname, 'frontend'))) {
            throw new Error('Error instalando dependencias del frontend');
        }
        
        // 4. Crear archivo .env
        console.log('\\n⚙️ Configurando variables de entorno...');
        createEnvFile();
        
        // 5. Inicializar base de datos
        console.log('\\n🗄️ Inicializando base de datos...');
        if (!runCommand('npm run migrate', join(__dirname, 'backend'))) {
            throw new Error('Error inicializando base de datos');
        }
        
        // 6. Poblar con datos de prueba
        console.log('\\n🌱 Poblando base de datos con datos de prueba...');
        if (!runCommand('npm run seed', join(__dirname, 'backend'))) {
            console.warn('⚠️ No se pudieron cargar datos de prueba');
        }
        
        // 7. Mostrar estadísticas
        console.log('\\n📊 Estadísticas de la base de datos:');
        runCommand('npm run stats', join(__dirname, 'backend'));
        
        // 8. Configurar modo local por defecto
        console.log('\\n🔄 Configurando modo local...');
        if (fs.existsSync(join(__dirname, 'switch-mode.js'))) {
            runCommand('node switch-mode.js local', __dirname);
        }
        
        // 9. Mostrar información final
        console.log('\\n🎉 ¡Instalación completada exitosamente!');
        console.log('====================================================');
        console.log('📋 Próximos pasos:');
        console.log('\\n🚀 Para iniciar el proyecto:');
        console.log('   1. Terminal 1 - Backend:');
        console.log('      cd backend && npm run dev');
        console.log('\\n   2. Terminal 2 - Frontend:');
        console.log('      cd frontend && npm run dev');
        console.log('\\n🌐 URLs de acceso:');
        console.log('   Frontend: http://localhost:5173');
        console.log('   Backend:  http://localhost:3001');
        console.log('   API Docs: http://localhost:3001/docs');
        console.log('\\n🔑 Credenciales de prueba:');
        console.log('   Email: test@timeline.com');
        console.log('   Contraseña: password123');
        console.log('\\n🔄 Cambiar entre modos:');
        console.log('   Modo Local:    node switch-mode.js local');
        console.log('   Modo Supabase: node switch-mode.js supabase');
        console.log('\\n📚 Documentación:');
        console.log('   README.md - Documentación principal');
        console.log('   frontend/README.md - Documentación frontend');
        console.log('   backend/README.md - Documentación backend');
        
    } catch (error) {
        console.error('\\n❌ Error durante la instalación:', error.message);
        console.log('\\n🔧 Solución de problemas:');
        console.log('   1. Verifica que Node.js 18+ esté instalado');
        console.log('   2. Verifica que npm esté funcionando');
        console.log('   3. Verifica permisos de escritura en el directorio');
        console.log('   4. Revisa los logs de error arriba');
        process.exit(1);
    }
}

// =====================================================
// FUNCIÓN DE DESINSTALACIÓN
// =====================================================

function uninstall() {
    console.log('🗑️ Desinstalando TimeLine...');
    
    try {
        // Eliminar node_modules
        const frontendNodeModules = join(__dirname, 'frontend/node_modules');
        const backendNodeModules = join(__dirname, 'backend/node_modules');
        
        if (fs.existsSync(frontendNodeModules)) {
            console.log('📦 Eliminando node_modules del frontend...');
            fs.rmSync(frontendNodeModules, { recursive: true, force: true });
        }
        
        if (fs.existsSync(backendNodeModules)) {
            console.log('📦 Eliminando node_modules del backend...');
            fs.rmSync(backendNodeModules, { recursive: true, force: true });
        }
        
        // Eliminar base de datos
        const dbPath = join(__dirname, 'backend/database');
        if (fs.existsSync(dbPath)) {
            console.log('🗄️ Eliminando base de datos...');
            fs.rmSync(dbPath, { recursive: true, force: true });
        }
        
        // Eliminar archivos de configuración
        const backendEnv = join(__dirname, 'backend/.env');
        if (fs.existsSync(backendEnv)) {
            console.log('⚙️ Eliminando configuración...');
            fs.unlinkSync(backendEnv);
        }
        
        console.log('✅ Desinstalación completada');
        
    } catch (error) {
        console.error('❌ Error durante la desinstalación:', error.message);
    }
}

// =====================================================
// MANEJO DE ARGUMENTOS
// =====================================================

const command = process.argv[2];

switch (command) {
    case 'install':
    case undefined:
        install();
        break;
    case 'uninstall':
        uninstall();
        break;
    case 'help':
    case '--help':
    case '-h':
        console.log('📋 Comandos disponibles:');
        console.log('  node install.js install    - Instalar proyecto (por defecto)');
        console.log('  node install.js uninstall  - Desinstalar proyecto');
        console.log('  node install.js help       - Mostrar esta ayuda');
        break;
    default:
        console.log('❌ Comando no reconocido');
        console.log('Usa: node install.js help');
        break;
}
