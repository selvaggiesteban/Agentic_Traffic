#!/bin/bash
# diag_server.sh - Infrastructure Audit for WooCommerce Stress Testing

echo "==============================================================="
echo "🔍 DIAGNÓSTICO DE INFRAESTRUCTURA - AGENTICTRAFFIC"
echo "==============================================================="
echo "Fecha: $(date)"
echo "Host: $(hostname)"
echo "---------------------------------------------------------------"

# 1. AUDITORÍA DE PHP
echo -e "\n[1] ANALIZANDO PHP..."
PHP_VER=$(php -r 'echo PHP_VERSION;')
MEM_LIMIT=$(php -r 'echo ini_get("memory_limit");')
MAX_EXEC=$(php -r 'echo ini_get("max_execution_time");')
OPCACHE=$(php -r 'echo extension_loaded("Zend OPcache") ? "SÍ" : "NO";')

echo "  - Versión de PHP: $PHP_VER"
echo "  - Límite de Memoria (memory_limit): $MEM_LIMIT"
echo "  - Tiempo Máx. Ejecución: $MAX_EXEC seg"
echo "  - OPcache Activo: $OPCACHE"

# Veredicto PHP
if [[ "$PHP_VER" < "8.1" ]]; then
    echo "  ⚠️ ADVERTENCIA: PHP version outdated. Recommend 8.2+ for performance."
fi
if [[ "$MEM_LIMIT" == "128M" ]]; then
    echo "  ⚠️ ADVERTENCIA: memory_limit es bajo para WooCommerce. Recomendado 256M o 512M."
fi

# 2. AUDITORÍA DE MYSQL
echo -e "\n[2] ANALIZANDO MYSQL..."
# Intentamos obtener max_connections vía mysql admin
MAX_CONN=$(mysql -e "SHOW VARIABLES LIKE 'max_connections';" -s -N | awk '{print $2}')

if [ -z "$MAX_CONN" ]; then
    echo "  ❌ ERROR: No se pudo conectar a MySQL o no hay permisos para ver variables."
else
    echo "  - Max Connections: $MAX_CONN"
    if [ "$MAX_CONN" -lt 100 ]; then
        echo "  🚨 CRÍTICO: max_connections es menor a tus PHP Workers (100). El sitio fallará por MySQL antes que por PHP."
    else
        echo "  ✅ OK: Capacidad de conexiones suficiente."
    fi
fi

# 3. AUDITORÍA de RECURSOS DEL SISTEMA
echo -e "\n[3] ANALIZANDO RECURSOS (RAM/DISK)..."
FREE_RAM=$(free -m | awk '/^Mem:/{print $4}')
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

echo "  - RAM Disponible: ${FREE_RAM}MB"
echo "  - Uso de Disco: ${DISK_USAGE}%"

if [ "$DISK_USAGE" -gt 85 ]; then
    echo "  ⚠️ ADVERTENCIA: Disco casi lleno. Las escrituras de órdenes podrían fallar."
fi

# 4. AUDITORÍA DE WORDPRESS/WOOCOMMERCE
echo -e "\n[4] ANALIZANDO WORDPRESS..."
PLUGIN_COUNT=$(wp plugin list --field=name | wc -l)

echo "  - Plugins Activos: $PLUGIN_COUNT"
if [ "$PLUGIN_COUNT" -gt 30 ]; then
    echo "  ⚠️ ADVERTENCIA: Demasiados plugins. Cada worker de PHP consumirá más RAM y CPU."
fi

echo "---------------------------------------------------------------"
echo -e "\n🎯 VEREDICTO FINAL:"

# Lógica de decisión final
if [[ "$MAX_CONN" -lt 100 ]] || [[ "$DISK_USAGE" -gt 90 ]]; then
    echo "❌ ESTADO: MAL CONFIGURADO"
    echo "Razón: El cuello de botella en MySQL o Disco es demasiado agresivo."
else
    echo "✅ ESTADO: LISTO PARA ESTRÉS"
    echo "Razón: Los límites básicos están alineados con la capacidad de los Workers."
fi
echo "==============================================================="
