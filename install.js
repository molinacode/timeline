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
        const versionParts = version.substring(1).split('.').map(v => parseInt(v));
        const requiredVersion = [20, 17, 0];
        
        // Comparar versiones
        let isValid = true;
        for (let i = 0; i < requiredVersion.length; i++) {
            if (versionParts[i] > requiredVersion[i]) {
                break; // Versión superior, válida
            }
            if (versionParts[i] < requiredVersion[i]) {
                isValid = false;
                break;
            }
        }
        
        if (!isValid) {
            console.error('❌ Node.js 20.17.0 es requerido. Versión actual:', version);
            console.error('   Por favor, actualiza Node.js a la versión 20.17.0 desde https://nodejs.org');
            process.exit(1);
        }
        
        console.log(`✅ Node.js ${version} detectado (requerido: 20.17.0)`);
        return true;
    } catch (error) {
        console.error('❌ Node.js no está instalado');
        console.error('   Por favor, instala Node.js 20.17.0 desde https://nodejs.org');
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
        
        // 5. Crear usuario admin y sincronizar fuentes (requiere Supabase configurado)
        console.log('\\n👤 Creando usuario admin y sincronizando fuentes...');
        if (!runCommand('npm run create-admin', join(__dirname, 'backend'))) {
            console.warn('⚠️ No se pudo crear el admin. Asegúrate de:');
            console.warn('   1. Crear un proyecto en https://dashboard.supabase.com');
            console.warn('   2. Ejecutar en el SQL Editor: backend/database/schema.supabase.sql y backend/database/rls-policies.supabase.sql');
            console.warn('   3. Configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en backend/.env');
        }
        
        // 6. Mostrar información final
        console.log('\\n🎉 ¡Instalación completada!');
        console.log('====================================================');
        console.log('📋 Próximos pasos:');
        console.log('\\n🗄️ Si aún no lo has hecho, configura Supabase:');
        console.log('   1. Crea un proyecto en https://dashboard.supabase.com');
        console.log('   2. En el SQL Editor ejecuta (en este orden):');
        console.log('      - backend/database/schema.supabase.sql');
        console.log('      - backend/database/rls-policies.supabase.sql');
        console.log('   3. En backend/.env pon SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
        console.log('   4. Vuelve a ejecutar: cd backend && npm run create-admin');
        console.log('\\n🚀 Para iniciar el proyecto:');
        console.log('   1. Terminal 1: cd backend && npm run dev');
        console.log('   2. Terminal 2: cd frontend && npm run dev');
        console.log('\\n🌐 URLs: Frontend http://localhost:5173 · Backend http://localhost:3001');
        console.log('\\n📚 Documentación: README.md · backend/docs/README.md');
        
    } catch (error) {
        console.error('\\n❌ Error durante la instalación:', error.message);
        console.log('\\n🔧 Solución de problemas:');
        console.log('   1. Verifica que Node.js 20.17.0 esté instalado');
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
