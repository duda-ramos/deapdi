#!/bin/bash
# =============================================================================
# TalentFlow - Supabase Database Restore Script
# =============================================================================
# 
# Uso:
#   ./scripts/restore-supabase.sh <arquivo_backup.sql.gz>
#   ./scripts/restore-supabase.sh --list
#
# ⚠️  ATENÇÃO: Este script APAGA dados existentes!
#     Sempre faça backup antes de executar restore.
#
# Requisitos:
#   - Supabase CLI instalado (npm install -g supabase)
#   - PostgreSQL client (psql) instalado
#   - Credenciais do banco de dados
#
# =============================================================================

set -e  # Exit on error
set -o pipefail  # Fail if any command in a pipeline fails

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATABASE_URL="${DATABASE_URL:-}"

# Função para listar backups disponíveis
list_backups() {
    echo ""
    echo -e "${BLUE}📋 Backups disponíveis em: $BACKUP_DIR${NC}"
    echo ""
    
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR"/*.gz 2>/dev/null)" ]; then
        echo "Arquivo                                    Tamanho    Data"
        echo "─────────────────────────────────────────────────────────────"
        ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' | while read file size d1 d2 d3; do
            printf "%-40s %-10s %s %s %s\n" "$(basename "$file")" "$size" "$d1" "$d2" "$d3"
        done
        echo ""
    else
        echo -e "${YELLOW}Nenhum backup encontrado.${NC}"
        echo ""
    fi
}

# Parse argumentos
if [ "$1" == "--list" ] || [ "$1" == "-l" ]; then
    list_backups
    exit 0
fi

if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Uso: $0 <arquivo_backup.sql.gz>"
    echo ""
    echo "Opções:"
    echo "  --list, -l     Lista backups disponíveis"
    echo "  --help, -h     Mostra esta ajuda"
    echo ""
    echo "Variáveis de ambiente:"
    echo "  DATABASE_URL   URL de conexão PostgreSQL"
    echo "  BACKUP_DIR     Diretório de backups (padrão: ./backups)"
    echo ""
    echo "Exemplo:"
    echo "  DATABASE_URL='postgresql://user:pass@host:5432/db' $0 backup.sql.gz"
    exit 0
fi

BACKUP_FILE="$1"

# Verificar argumento
if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Arquivo de backup não especificado!${NC}"
    echo ""
    echo "Uso: $0 <arquivo_backup.sql.gz>"
    echo "     $0 --list"
    list_backups
    exit 1
fi

# Se for apenas nome do arquivo, procurar no diretório de backups
if [ ! -f "$BACKUP_FILE" ] && [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

# Verificar se arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Arquivo não encontrado: $BACKUP_FILE${NC}"
    list_backups
    exit 1
fi

# Verificar psql
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql não encontrado!${NC}"
    echo "Instale o PostgreSQL client."
    exit 1
fi

# Verificar DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL não definido.${NC}"
    echo ""
    echo "Por favor, forneça a URL de conexão do banco de dados."
    echo "Você pode encontrar em: Supabase Dashboard → Settings → Database → Connection string"
    echo ""
    echo "Exemplo:"
    echo "  export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres'"
    echo ""
    exit 1
fi

echo ""
echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║      ⚠️  ATENÇÃO: RESTORE DO BANCO DE DADOS ⚠️              ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Esta operação irá:${NC}"
echo "  • Sobrescrever dados existentes no banco"
echo "  • Restaurar o banco para o estado do backup"
echo "  • Esta ação NÃO pode ser desfeita!"
echo ""
echo -e "${BLUE}Arquivo de backup: $BACKUP_FILE${NC}"
echo -e "${BLUE}Tamanho: $(ls -lh "$BACKUP_FILE" | awk '{print $5}')${NC}"
echo ""

# Confirmação
echo -e "${YELLOW}Para confirmar o restore, digite 'RESTAURAR' (em maiúsculas):${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "RESTAURAR" ]; then
    echo -e "${GREEN}✓ Operação cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Iniciando restore...${NC}"

# Preparar arquivo
TEMP_FILE=""
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "   📦 Descomprimindo backup..."
    TEMP_FILE=$(mktemp)
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    SQL_FILE="$TEMP_FILE"
else
    SQL_FILE="$BACKUP_FILE"
fi

# Executar restore
START_TIME=$(date +%s)
echo "   🔧 Executando SQL..."

if psql "$DATABASE_URL" < "$SQL_FILE" 2>&1 | tee /tmp/restore_output.log; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # Limpar arquivo temporário
    if [ -n "$TEMP_FILE" ]; then
        rm -f "$TEMP_FILE"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Restore concluído com sucesso!${NC}"
    echo ""
    echo -e "${BLUE}📊 Detalhes:${NC}"
    echo "   Backup:   $(basename "$BACKUP_FILE")"
    echo "   Duração:  ${DURATION}s"
    echo ""
    echo -e "${YELLOW}⚠️  Próximos passos recomendados:${NC}"
    echo "   1. Verifique os dados restaurados"
    echo "   2. Teste funcionalidades críticas da aplicação"
    echo "   3. Verifique RLS policies e triggers"
    echo ""
else
    # Limpar arquivo temporário
    if [ -n "$TEMP_FILE" ]; then
        rm -f "$TEMP_FILE"
    fi
    
    echo ""
    echo -e "${RED}❌ Erro durante o restore!${NC}"
    echo "Verifique o log em: /tmp/restore_output.log"
    exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
