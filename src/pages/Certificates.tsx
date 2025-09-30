import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Eye, Share2, CheckCircle, Calendar, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { courseService, Certificate } from '../services/courses';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

const Certificates: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<Certificate | null>(null);

  useEffect(() => {
    if (user) {
      loadCertificates();
    }
  }, [user]);

  const loadCertificates = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await courseService.getUserCertificates(user.id);
      setCertificates(data || []);
    } catch (error) {
      console.error('Erro ao carregar certificados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      const pdfUrl = await courseService.generateCertificatePDF(certificate.id);
      
      // Create download link
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `certificado-${certificate.certificate_number}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar certificado:', error);
    }
  };

  const handlePreviewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowPreviewModal(true);
  };

  const handleVerifyCertificate = async () => {
    try {
      const result = await courseService.verifyCertificate(verificationCode);
      setVerificationResult(result);
    } catch (error) {
      console.error('Erro ao verificar certificado:', error);
      setVerificationResult(null);
    }
  };

  const handleShareCertificate = (certificate: Certificate) => {
    const shareData = {
      title: `Certificado - ${certificate.course?.title}`,
      text: `Acabei de concluir o curso "${certificate.course?.title}" na TalentFlow!`,
      url: `${window.location.origin}/certificates/verify/${certificate.verification_code}`
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareData.url);
      alert('Link copiado para a área de transferência!');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'info';
      case 'soft-skills': return 'success';
      case 'leadership': return 'warning';
      case 'compliance': return 'danger';
      default: return 'default';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'technical': return 'Técnico';
      case 'soft-skills': return 'Soft Skills';
      case 'leadership': return 'Liderança';
      case 'compliance': return 'Compliance';
      default: return category;
    }
  };

  if (loading) {
    return <LoadingScreen message="Carregando certificados..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Certificados</h1>
          <p className="text-gray-600 mt-1">Seus certificados de conclusão de cursos</p>
        </div>
        <Button onClick={() => setShowVerifyModal(true)} variant="secondary">
          <CheckCircle size={16} className="mr-2" />
          Verificar Certificado
        </Button>
      </div>

      {/* Certificates Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{certificates.length}</div>
              <div className="text-sm text-gray-600">Total de Certificados</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {certificates.filter(c => c.course?.category === 'technical').length}
              </div>
              <div className="text-sm text-gray-600">Técnicos</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {certificates.filter(c => c.course?.category === 'leadership').length}
              </div>
              <div className="text-sm text-gray-600">Liderança</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {new Date().getFullYear()}
              </div>
              <div className="text-sm text-gray-600">Ano Atual</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <Card className="p-8 text-center">
          <Award size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum certificado encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Complete cursos para ganhar certificados e mostrar suas conquistas.
          </p>
          <Button onClick={() => window.location.href = '/learning'}>
            <Award size={16} className="mr-2" />
            Explorar Cursos
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <motion.div
              key={certificate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: certificates.indexOf(certificate) * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Award size={32} />
                    <Badge variant="default" className="bg-white/20 text-white border-white/30">
                      {getCategoryLabel(certificate.course?.category || 'general')}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {certificate.course?.title}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Instrutor: {certificate.course?.instructor}
                  </p>
                </div>

                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={16} className="mr-2" />
                      <span>Emitido em: {new Date(certificate.issued_at).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="mr-2" />
                      <span>Certificado Nº: {certificate.certificate_number}</span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Código de Verificação:</p>
                      <p className="font-mono text-sm font-medium text-gray-900">
                        {certificate.verification_code}
                      </p>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handlePreviewCertificate(certificate)}
                        className="flex-1"
                      >
                        <Eye size={14} className="mr-1" />
                        Visualizar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownloadCertificate(certificate)}
                        className="flex-1"
                      >
                        <Download size={14} className="mr-1" />
                        Baixar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleShareCertificate(certificate)}
                      >
                        <Share2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Certificate Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Visualizar Certificado"
        size="xl"
      >
        {selectedCertificate && (
          <div className="space-y-4">
            <div 
              className="border border-gray-200 rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ 
                __html: courseService.generateCertificateHTML(selectedCertificate) 
              }}
            />
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => handleDownloadCertificate(selectedCertificate)}
              >
                <Download size={16} className="mr-2" />
                Baixar
              </Button>
              <Button onClick={() => handleShareCertificate(selectedCertificate)}>
                <Share2 size={16} className="mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Verify Certificate Modal */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setVerificationCode('');
          setVerificationResult(null);
        }}
        title="Verificar Certificado"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Código de Verificação"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
            placeholder="Ex: A1B2C3D4"
            maxLength={8}
          />

          <Button
            onClick={handleVerifyCertificate}
            disabled={verificationCode.length !== 8}
            className="w-full"
          >
            Verificar Certificado
          </Button>

          {verificationResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="text-green-500" size={20} />
                <span className="font-medium text-green-900">Certificado Válido</span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Curso:</span>
                  <span className="font-medium ml-2">{verificationResult.course?.title}</span>
                </div>
                <div>
                  <span className="text-gray-600">Aluno:</span>
                  <span className="font-medium ml-2">{verificationResult.profile?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Emitido em:</span>
                  <span className="font-medium ml-2">
                    {new Date(verificationResult.issued_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Certificado Nº:</span>
                  <span className="font-medium ml-2">{verificationResult.certificate_number}</span>
                </div>
              </div>
            </div>
          )}

          {verificationCode.length === 8 && !verificationResult && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-500">❌</span>
                <span className="font-medium text-red-900">Certificado não encontrado</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Verifique se o código foi digitado corretamente.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Certificates;