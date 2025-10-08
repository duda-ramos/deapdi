import React from 'react';
import { AlertTriangle, Copy, ExternalLink, Terminal } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { getSetupInstructions } from '../utils/supabaseAutoConfig';

interface ConfigurationErrorProps {
  error: string;
  onRetry?: () => void;
}

export const ConfigurationError: React.FC<ConfigurationErrorProps> = ({ error, onRetry }) => {
  const instructions = getSetupInstructions();
  const [copiedCommand, setCopiedCommand] = React.useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(text);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Error Alert */}
        <Card className="p-6 mb-6 bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Erro de Configuração
              </h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </Card>

        {/* Quick Setup Instructions */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Configuração Rápida</h3>
          <div className="space-y-4">
            {instructions.steps.map((step, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900 mb-1">
                  {index + 1}. {step.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                
                {step.command && (
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {step.command}
                    </code>
                    <button
                      onClick={() => copyToClipboard(step.command)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Copiar comando"
                    >
                      {copiedCommand === step.command ? (
                        <span className="text-green-600 text-sm">Copiado!</span>
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                )}
                
                {step.link && (
                  <a
                    href={step.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                  >
                    <ExternalLink size={14} className="mr-1" />
                    {step.link.text}
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Troubleshooting */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Solução de Problemas</h3>
          <div className="space-y-3">
            {instructions.troubleshooting.map((item, index) => (
              <details key={index} className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium text-gray-900">{item.problem}</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </div>
                </summary>
                <div className="mt-2 p-3 text-sm text-gray-600 bg-gray-50 rounded-lg">
                  {item.solution}
                </div>
              </details>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              Tentar Novamente
            </Button>
          )}
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => window.open('https://supabase.com/docs', '_blank')}
          >
            <Terminal size={16} className="mr-2" />
            Ver Documentação
          </Button>
        </div>
      </div>
    </div>
  );
};