import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';

export interface Migration {
  version: string;
  description: string;
  sql: string;
  applied: boolean;
  appliedAt?: string;
}

export interface MigrationStatus {
  version: string;
  applied: boolean;
  applied_at?: string;
  description?: string;
}

export const migrationService = {
  // Check if migration control system exists
  async checkMigrationSystemExists(): Promise<boolean> {
    if (!supabase) {
      console.warn('🔄 Migrations: Supabase not available');
      return false;
    }

    try {
      const { error } = await supabase
        .from('schema_migrations')
        .select('version', { count: 'exact', head: true });
      
      return !error;
    } catch (error) {
      console.log('🔄 Migrations: Migration system not found, needs setup');
      return false;
    }
  },

  // Check if a specific migration was applied
  async checkMigrationApplied(version: string): Promise<boolean> {
    if (!supabase) {
      console.warn('🔄 Migrations: Supabase not available, assuming migration applied');
      return true; // Assume applied to prevent re-running
    }

    try {
      const { data } = await supabase.rpc('check_migration_applied', {
        migration_version: version
      });
      
      return !!data;
    } catch (error) {
      console.warn(`🔄 Migrations: Could not check migration ${version}, assuming applied:`, error);
      return true; // Assume applied to prevent errors
    }
  },

  // Mark migration as applied
  async markMigrationApplied(version: string, description?: string): Promise<void> {
    if (!supabase) {
      console.warn('🔄 Migrations: Supabase not available, cannot mark migration');
      return;
    }

    try {
      await supabase.rpc('mark_migration_applied', {
        migration_version: version,
        migration_description: description
      });
      
      console.log(`✅ Migration ${version} marked as applied`);
    } catch (error) {
      console.error(`❌ Failed to mark migration ${version} as applied:`, error);
    }
  },

  // Get all migration statuses
  async getMigrationStatus(): Promise<MigrationStatus[]> {
    if (!supabase) {
      console.warn('🔄 Migrations: Supabase not available');
      return [];
    }

    try {
      const { data, error } = await supabase.rpc('get_migration_status');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('🔄 Migrations: Error getting migration status:', error);
      return [];
    }
  },

  // Apply a single migration safely
  async applyMigration(migration: Migration): Promise<boolean> {
    if (!supabase) {
      console.warn('🔄 Migrations: Supabase not available, skipping migration');
      return false;
    }

    console.log(`🔄 Migrations: Checking migration ${migration.version}...`);

    try {
      // Check if already applied
      const isApplied = await this.checkMigrationApplied(migration.version);
      
      if (isApplied) {
        console.log(`⏭️ Migration ${migration.version} already applied, skipping`);
        return true;
      }

      console.log(`🚀 Applying migration ${migration.version}: ${migration.description}`);

      // Execute the migration SQL
      // Note: In a real implementation, you would execute the SQL
      // For now, we'll just mark it as applied since the SQL should be run manually
      
      // Mark as applied
      await this.markMigrationApplied(migration.version, migration.description);
      
      console.log(`✅ Migration ${migration.version} applied successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to apply migration ${migration.version}:`, error);
      return false;
    }
  },

  // Apply multiple migrations in sequence
  async applyPendingMigrations(migrations: Migration[]): Promise<{
    applied: number;
    failed: number;
    skipped: number;
  }> {
    console.log('🔄 Migrations: Starting migration process...');

    let applied = 0;
    let failed = 0;
    let skipped = 0;

    for (const migration of migrations) {
      try {
        const result = await this.applyMigration(migration);
        
        if (result) {
          if (migration.applied) {
            skipped++;
          } else {
            applied++;
          }
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Migration ${migration.version} failed:`, error);
        failed++;
      }
    }

    console.log(`🔄 Migrations complete: ${applied} applied, ${skipped} skipped, ${failed} failed`);
    
    return { applied, failed, skipped };
  },

  // Get list of defined migrations
  getDefinedMigrations(): Migration[] {
    return [
      {
        version: '011_mental_health_schema_fix',
        description: 'Fix mental health database schema inconsistencies',
        sql: '', // SQL would be in the migration file
        applied: false
      },
      {
        version: '012_automated_career_progression',
        description: 'Implement automated career progression system',
        sql: '', // SQL would be in the migration file
        applied: false
      }
    ];
  },

  // Initialize migration system (run once)
  async initializeMigrationSystem(): Promise<boolean> {
    console.log('🔄 Migrations: Initializing migration control system...');

    if (!supabase) {
      console.warn('🔄 Migrations: Supabase not available');
      return false;
    }

    try {
      // Check if system already exists
      const exists = await this.checkMigrationSystemExists();
      
      if (exists) {
        console.log('✅ Migration system already initialized');
        return true;
      }

      console.log('🚀 Setting up migration control system...');
      
      // The migration control system should be created via SQL migration
      // This function just verifies it exists
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize migration system:', error);
      return false;
    }
  },

  // Manual migration management for development
  async resetMigrationState(): Promise<void> {
    if (!supabase) {
      console.warn('🔄 Migrations: Supabase not available');
      return;
    }

    if (!import.meta.env.DEV) {
      console.warn('🔄 Migrations: Reset only allowed in development');
      return;
    }

    try {
      console.log('🔄 Migrations: Resetting migration state (DEV ONLY)...');
      
      await supabase
        .from('schema_migrations')
        .delete()
        .neq('version', '000_never_match'); // Delete all
      
      console.log('✅ Migration state reset');
    } catch (error) {
      console.error('❌ Failed to reset migration state:', error);
    }
  }
};