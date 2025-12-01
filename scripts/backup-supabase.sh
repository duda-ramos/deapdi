#!/bin/bash
# =============================================================================
# TalentFlow - Supabase Database Backup Script
# =============================================================================
# 
# Uso:
#   ./scripts/backup-supabase.sh
#   ./scripts/backup-supabase.sh --project-ref abc123
#
# Requisitos:
#   - Supabase CLI instalado (npm install -g supabase)
#   - Login no Supabase (supabase login)
#   - Projeto linkado (supabase link --project-ref <ref>)
#
# =============================================================================

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações padrão
BACKUP_DIR="${BACKUP_DIR:-./backups}"
MAX_BACKUPS="${MAX_BACKUPS:-30}"
PROJECT_REF="${SUPABASE_PROJECT_REF:-}"

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --project-ref)
            PROJECT_REF="$2"
            shift 2
            ;;
        --backup-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --max-backups)
            MAX_BACKUPS="$2"
            shift 2
            ;;
        --help)
            echo "Uso: $0 [opções]"
            echo ""
            echo "Opções:"
            echo "  --project-ref <ref>   Project ref do Supabase"
            echo "  --backup-dir <dir>    Diretório para backups (padrão: ./backups)"
            echo "  --max-backups <n>     Número máximo de backups a manter (padrão: 30)"
            echo "  --help                Mostra esta ajuda"
            echo ""
            echo "Variáveis de ambiente:"
            echo "  SUPABASE_PROJECT_REF  Project ref do Supabase"
            echo "  BACKUP_DIR            Diretório para backups"
            echo "  MAX_BACKUPS           Número máximo de backups"
            exit 0
            ;;
        *)
            echo -e "${RED}Opção desconhecida: $1${NC}"
            exit 1
            ;;
    esac
done

# Verificar Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI não encontrado!${NC}"
    echo "Instale com: npm install -g supabase"
    exit 1
fi

# Verificar project ref
if [ -z "$PROJECT_REF" ]; then
    echo -e "${YELLOW}⚠️  Project ref não especificado.${NC}"
    echo "Use --project-ref ou defina SUPABASE_PROJECT_REF"
    echo ""
    echo "Tentando usar projeto linkado..."
    
    # Tentar obter do projeto linkado
    if [ -f ".supabase/project-ref" ]; then
        PROJECT_REF=$(cat .supabase/project-ref)
        echo -e "${GREEN}✓ Usando projeto: $PROJECT_REF${NC}"
    else
        echo -e "${RED}❌ Nenhum projeto linkado encontrado.${NC}"
        echo "Execute: supabase link --project-ref <seu-project-ref>"
        exit 1
    fi
fi

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Gerar nome do arquivo
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/talentflow_${DATE}.sql"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           TalentFlow - Backup do Banco de Dados            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Configuração:${NC}"
echo "   Project Ref: $PROJECT_REF"
echo "   Backup Dir:  $BACKUP_DIR"
echo "   Max Backups: $MAX_BACKUPS"
echo ""

# Executar backup
echo -e "${YELLOW}🔄 Iniciando backup...${NC}"
START_TIME=$(date +%s)

if supabase db dump --project-ref "$PROJECT_REF" > "$BACKUP_FILE" 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # Verificar se arquivo foi criado e tem conteúdo
    if [ -s "$BACKUP_FILE" ]; then
        # Comprimir backup
        echo -e "${YELLOW}📦 Comprimindo backup...${NC}"
        gzip "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"
        
        # Obter tamanho
        SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        
        echo ""
        echo -e "${GREEN}✅ Backup concluído com sucesso!${NC}"
        echo ""
        echo -e "${BLUE}📊 Detalhes:${NC}"
        echo "   Arquivo:  $BACKUP_FILE"
        echo "   Tamanho:  $SIZE"
        echo "   Duração:  ${DURATION}s"
        echo ""
        
        # Limpar backups antigos
        BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/*.gz 2>/dev/null | wc -l)
        if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
            echo -e "${YELLOW}🧹 Limpando backups antigos...${NC}"
            REMOVED=$((BACKUP_COUNT - MAX_BACKUPS))
            ls -t "${BACKUP_DIR}"/*.gz | tail -n +"$((MAX_BACKUPS + 1))" | xargs -r rm
            echo "   Removidos: $REMOVED backups antigos"
            echo ""
        fi
        
        echo -e "${GREEN}✓ Backup disponível em: $BACKUP_FILE${NC}"
        
    else
        echo -e "${RED}❌ Arquivo de backup está vazio!${NC}"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
else
    echo -e "${RED}❌ Erro ao criar backup!${NC}"
    rm -f "$BACKUP_FILE"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
