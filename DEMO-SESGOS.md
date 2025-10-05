# 🗞️ TimeLine RSS Aggregator - Demo de Sesgos Políticos

## 📋 Descripción

Esta demo muestra cómo **TimeLine RSS Aggregator** puede analizar y visualizar el sesgo político en la cobertura de noticias, similar a plataformas como **Ground.news**. La demo utiliza datos estáticos JSON para simular el comportamiento real del sistema.

## 🎯 Características de la Demo

### 📊 **Análisis de Sesgos**
- **6 fuentes** de noticias españolas (2 por orientación política)
- **3 historias** de ejemplo con cobertura completa
- **18 coberturas** totales distribuidas por sesgo político
- **Visualización** tipo Ground.news con barras de sesgo

### 🏛️ **Fuentes por Orientación Política**

#### 🔴 **Conservadoras**
- **ABC** - Periódico conservador español
- **La Razón** - Periódico conservador

#### ⚪ **Centristas**
- **El Mundo** - Periódico centrista
- **20 Minutos** - Periódico gratuito centrista

#### 🔵 **Progresistas**
- **El País** - Periódico progresista
- **El Diario** - Medio digital progresista

### 📰 **Historias de Ejemplo**

1. **Ley de Vivienda** - Política
   - 6 coberturas (2 conservadoras, 2 centristas, 2 progresistas)
   - Muestra diferentes enfoques sobre la misma noticia

2. **Invierno Cálido** - Medio Ambiente
   - 6 coberturas (1 conservadora, 2 centristas, 3 progresistas)
   - Ilustra diferencias en cobertura climática

3. **Récord Turístico** - Economía
   - 6 coberturas (2 conservadoras, 2 centristas, 2 progresistas)
   - Enfoques diversos sobre el turismo

## 🚀 **Cómo Usar la Demo**

### 1. **Acceder a la Demo**
- Haz clic en el botón **"Demo Sesgos"** en el menú principal
- O navega directamente a la sección de demo

### 2. **Explorar el Dashboard**
- **Estadísticas generales**: Número de historias, coberturas y fuentes
- **Distribución de sesgos**: Visualización de cobertura por orientación política
- **Filtros**: Buscar por texto o categoría

### 3. **Analizar Historias**
- Haz clic en cualquier historia para ver el análisis detallado
- **Barra de sesgo**: Muestra la distribución política de la cobertura
- **Cobertura por fuentes**: Artículos organizados por sesgo político

### 4. **Examinar Fuentes**
- Haz clic en cualquier fuente para ver su información
- **Perfil de la fuente**: Descripción, sesgo, enlaces
- **Cobertura en la demo**: Cuántas historias ha cubierto

## 📁 **Estructura de Datos**

### **Archivo Principal**: `frontend/src/data/demoData.json`
```json
{
  "sources": {
    "conservative": [...],
    "centrist": [...],
    "progressive": [...]
  },
  "newsStories": [...],
  "biasMetrics": {...},
  "statistics": {...}
}
```

### **Servicio**: `frontend/src/services/demoDataService.ts`
- Manejo de datos estáticos
- Cálculos de análisis de sesgo
- Filtros y búsquedas

### **Componentes**:
- `DemoDashboard.tsx` - Dashboard principal
- `BiasVisualization.tsx` - Visualización de sesgos

## 🎨 **Características Visuales**

### **Colores por Sesgo**
- 🔴 **Conservador**: `#dc2626` (Rojo)
- ⚪ **Centrista**: `#6b7280` (Gris)
- 🔵 **Progresista**: `#2563eb` (Azul)

### **Elementos Visuales**
- **Barras de sesgo** con porcentajes
- **Tarjetas de cobertura** con tono emocional
- **Iconos de tono** (😊, 😞, ⚠️, 🚨, etc.)
- **Gráficos de distribución** por sesgo

## 🔧 **Implementación Técnica**

### **Sin Dependencias Externas**
- ✅ **Datos estáticos** en JSON
- ✅ **Componentes React** nativos
- ✅ **Tailwind CSS** para estilos
- ✅ **TypeScript** para tipado

### **Funcionalidades**
- **Búsqueda** en tiempo real
- **Filtros** por categoría
- **Navegación** entre historias y fuentes
- **Responsive** design

## 📈 **Métricas de la Demo**

- **Total de fuentes**: 6
- **Total de historias**: 3
- **Total de coberturas**: 18
- **Promedio por historia**: 6 coberturas
- **Distribución de sesgos**:
  - Conservador: 5 coberturas (28%)
  - Centrista: 5 coberturas (28%)
  - Progresista: 8 coberturas (44%)

## 🎯 **Objetivos de la Demo**

1. **Demostrar** el concepto de análisis de sesgo político
2. **Mostrar** cómo diferentes fuentes cubren la misma noticia
3. **Visualizar** la distribución política de la cobertura
4. **Ilustrar** el valor del agregador de noticias

## 🚀 **Próximos Pasos**

Para convertir esta demo en un sistema real:

1. **Integrar** con el parser RSS nativo
2. **Conectar** con fuentes reales de noticias
3. **Implementar** análisis automático de sesgo
4. **Añadir** más fuentes y categorías
5. **Desarrollar** algoritmos de detección de sesgo

## 📝 **Notas Técnicas**

- Los datos son **completamente estáticos**
- No requiere **APIs externas**
- Funciona **offline**
- Ideal para **presentaciones** y **demos**
- **Fácil de personalizar** y extender

---

**¡La demo está lista para usar!** 🎉

Haz clic en **"Demo Sesgos"** en el menú principal para comenzar a explorar el análisis de sesgos políticos en las noticias españolas.
