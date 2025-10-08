#!/usr/bin/env node

/**
 * Script de migração de configuração
 * Ajuda a migrar de configurações manuais para o novo sistema automático
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

console.log('🔄 Script de Migração de Configuração do Supabase\n');

// Verifica se .env já existe
if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env já existe!');
  
  // Lê o conteúdo atual
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verifica se já tem as variáveis do Supabase
  if (envContent.includes('VITE_SUPABASE_URL') && envContent.includes('VITE_SUPABASE_ANON_KEY')) {
    console.log('✅ Variáveis do Supabase já estão configuradas!\n');
    console.log('🎉 Não é necessária nenhuma ação. O sistema usará automaticamente suas configurações.');
  } else {
    console.log('⚠️  Variáveis do Supabase não encontradas no .env\n');
    console.log('Você deseja adicionar as variáveis padrão do Supabase? (s/n)');
    
    rl.question('> ', (answer) => {
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
        // Adiciona as variáveis ao .env existente
        const supabaseConfig = `
# Configuração do Supabase
VITE_SUPABASE_URL=https://fvobspjiujcurfugjsxr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2b2JzcGppdWpjdXJmdWdqc3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzA3OTcsImV4cCI6MjA3MzcwNjc5N30.FUWbuvg-Oalt3HiZX6YSjR609SFFkgleEJbFUJ9AFZ8
`;
        
        fs.appendFileSync(envPath, supabaseConfig);
        console.log('\n✅ Variáveis do Supabase adicionadas ao .env!');
        console.log('🎉 Configuração concluída! Reinicie o servidor para aplicar as mudanças.');
      } else {
        console.log('\n📝 Para configurar manualmente, adicione as seguintes variáveis ao seu .env:');
        console.log('VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
        console.log('VITE_SUPABASE_ANON_KEY=sua-chave-anonima');
      }
      rl.close();
    });
  }
} else {
  // .env não existe, cria a partir do .env.example
  console.log('📋 Arquivo .env não encontrado.');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('✅ Arquivo .env.example encontrado!\n');
    console.log('Deseja criar o .env a partir do .env.example? (s/n)');
    
    rl.question('> ', (answer) => {
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('\n✅ Arquivo .env criado com sucesso!');
        console.log('🎉 Configuração concluída! Agora você pode iniciar o servidor.');
        console.log('\n💡 Dica: Para usar suas próprias credenciais, edite o arquivo .env');
      } else {
        console.log('\n📝 Para criar manualmente, execute:');
        console.log('cp .env.example .env');
        console.log('\nDepois edite o arquivo com suas credenciais.');
      }
      rl.close();
    });
  } else {
    console.log('❌ Arquivo .env.example não encontrado!');
    console.log('\n📝 Crie um arquivo .env na raiz do projeto com:');
    console.log('VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
    console.log('VITE_SUPABASE_ANON_KEY=sua-chave-anonima');
    rl.close();
  }
}

// Limpeza de configurações antigas do localStorage
console.log('\n🧹 Verificando configurações antigas...');

// Nota: Este script não pode acessar o localStorage diretamente
// Mas podemos adicionar um código para ser executado no navegador
const cleanupCode = `
// Execute este código no console do navegador para limpar configurações antigas:
localStorage.removeItem('TEMP_SUPABASE_URL');
localStorage.removeItem('TEMP_SUPABASE_ANON_KEY');
localStorage.removeItem('OFFLINE_MODE');
console.log('✅ Configurações antigas removidas!');
`;

console.log('\n💡 Para limpar configurações antigas do navegador, execute no console:');
console.log(cleanupCode);