import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, Building, User, ChevronDown, ChevronRight, Settings, Eye, CreditCard as Edit } from 'lucide-react';
import { peopleManagementService } from '../../services/peopleManagement';
import { Profile } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingScreen } from '../ui/LoadingScreen';
import { getAvatarUrl, handleImageError } from '../../utils/images';

interface OrgNode {
  profile: Profile;
  children: OrgNode[];
  level: number;
}

interface OrganizationalChartProps {
  onProfileSelect?: (profile: Profile) => void;
  onProfileEdit?: (profile: Profile) => void;
}

export const OrganizationalChart: React.FC<OrganizationalChartProps> = ({
  onProfileSelect,
  onProfileEdit
}) => {
  const [orgData, setOrgData] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'hierarchy' | 'teams'>('hierarchy');

  useEffect(() => {
    loadOrganizationalData();
  }, []);

  const loadOrganizationalData = async () => {
    try {
      setLoading(true);
      const data = await peopleManagementService.getOrganizationalChart();
      setOrgData(data);
      
      // Auto-expand top level nodes
      const topLevelIds = new Set([
        ...data.admins.map((p: Profile) => p.id),
        ...data.managers.map((m: any) => m.id)
      ]);
      setExpandedNodes(topLevelIds);
    } catch (error) {
      console.error('Error loading organizational data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderProfileCard = (profile: Profile, level: number = 0, hasChildren: boolean = false) => {
    const isExpanded = expandedNodes.has(profile.id);
    
    return (
      <motion.div
        key={profile.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative ${level > 0 ? 'ml-8' : ''}`}
      >
        {/* Connection Line */}
        {level > 0 && (
          <div className="absolute -left-4 top-6 w-4 h-0.5 bg-gray-300" />
        )}
        
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {hasChildren && (
                <button
                  onClick={() => toggleNode(profile.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </button>
              )}
              
              <img
                src={getAvatarUrl(profile.avatar_url, profile.name)}
                alt={profile.name}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => handleImageError(e, profile.name)}
              />
              
              <div>
                <h4 className="font-medium text-gray-900">{profile.name}</h4>
                <p className="text-sm text-gray-600">{profile.position}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={
                    profile.role === 'admin' ? 'danger' :
                    profile.role === 'hr' ? 'warning' :
                    profile.role === 'manager' ? 'info' : 'default'
                  } size="sm">
                    {profile.role === 'admin' ? 'Admin' :
                     profile.role === 'hr' ? 'RH' :
                     profile.role === 'manager' ? 'Gestor' : 'Colaborador'}
                  </Badge>
                  {profile.role === 'manager' && (
                    <Crown size={14} className="text-yellow-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-right text-sm">
                <div className="font-semibold text-blue-600">{profile.points}</div>
                <div className="text-gray-500">pontos</div>
              </div>
              
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onProfileSelect?.(profile)}
                >
                  <Eye size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onProfileEdit?.(profile)}
                >
                  <Edit size={14} />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  const renderHierarchyView = () => {
    if (!orgData) return null;

    return (
      <div className="space-y-6">
        {/* Admins */}
        {orgData.admins.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="mr-2 text-red-500" size={20} />
              Administradores
            </h3>
            <div className="space-y-3">
              {orgData.admins.map((admin: Profile) => 
                renderProfileCard(admin, 0, false)
              )}
            </div>
          </div>
        )}

        {/* HR */}
        {orgData.hr.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="mr-2 text-orange-500" size={20} />
              Recursos Humanos
            </h3>
            <div className="space-y-3">
              {orgData.hr.map((hr: Profile) => 
                renderProfileCard(hr, 0, false)
              )}
            </div>
          </div>
        )}

        {/* Managers and their teams */}
        {orgData.managers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Crown className="mr-2 text-blue-500" size={20} />
              Gestores e Equipes
            </h3>
            <div className="space-y-4">
              {orgData.managers.map((manager: any) => (
                <div key={manager.id}>
                  {renderProfileCard(manager, 0, manager.team_members.length > 0)}
                  
                  {expandedNodes.has(manager.id) && manager.team_members.length > 0 && (
                    <div className="ml-8 mt-3 space-y-2">
                      {manager.team_members.map((member: Profile) =>
                        renderProfileCard(member, 1, false)
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unassigned employees */}
        {orgData.unassigned.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="mr-2 text-gray-500" size={20} />
              Colaboradores Sem Gestor
            </h3>
            <div className="space-y-3">
              {orgData.unassigned.map((employee: Profile) => 
                renderProfileCard(employee, 0, false)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTeamsView = () => {
    if (!orgData) return null;

    // Group by teams
    const teamGroups = new Map();
    
    [...orgData.managers, ...orgData.unassigned].forEach((profile: Profile) => {
      const teamName = profile.team?.name || 'Sem Time';
      if (!teamGroups.has(teamName)) {
        teamGroups.set(teamName, []);
      }
      teamGroups.get(teamName).push(profile);
    });

    return (
      <div className="space-y-6">
        {Array.from(teamGroups.entries()).map(([teamName, members]) => (
          <div key={teamName}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="mr-2 text-blue-500" size={20} />
              {teamName}
              <Badge variant="default" size="sm" className="ml-2">
                {members.length} membro{members.length !== 1 ? 's' : ''}
              </Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member: Profile) => (
                <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <img
                      src={getAvatarUrl(member.avatar_url, member.name)}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => handleImageError(e, member.name)}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{member.name}</h4>
                      <p className="text-sm text-gray-600">{member.position}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={
                          member.role === 'manager' ? 'info' : 'default'
                        } size="sm">
                          {member.role === 'manager' ? 'Gestor' : 'Colaborador'}
                        </Badge>
                        {member.role === 'manager' && (
                          <Crown size={12} className="text-yellow-500" />
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold text-blue-600">{member.points}</div>
                      <div className="text-gray-500">pts</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return <LoadingScreen message="Carregando organograma..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Organograma</h2>
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'hierarchy'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Hierarquia
          </button>
          <button
            onClick={() => setViewMode('teams')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'teams'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Por Times
          </button>
        </div>
      </div>

      {viewMode === 'hierarchy' ? renderHierarchyView() : renderTeamsView()}
    </div>
  );
};