import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'soft-skills' | 'leadership' | 'compliance';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  instructor: string;
  thumbnail_url?: string;
  points: number;
  competency_mappings: CompetencyMapping[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'text' | 'quiz' | 'assignment';
  duration_minutes: number;
  order_index: number;
  is_required: boolean;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  profile_id: string;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  progress_percentage: number;
  current_module_id?: string;
  status: 'enrolled' | 'in-progress' | 'completed' | 'dropped';
}

export interface CourseProgress {
  id: string;
  enrollment_id: string;
  module_id: string;
  completed_at: string;
  time_spent_minutes: number;
}

export interface Certificate {
  id: string;
  profile_id: string;
  course_id: string;
  enrollment_id: string;
  certificate_number: string;
  issued_at: string;
  pdf_url?: string;
  verification_code: string;
  is_valid: boolean;
  created_at: string;
}

export interface CompetencyMapping {
  competency: string;
  rating_boost: number;
}

export interface CourseWithProgress extends Course {
  enrollment?: CourseEnrollment;
  modules?: CourseModule[];
  completed_modules?: number;
  total_modules?: number;
}

export const courseService = {
  // Course Management
  async getCourses(includeInactive = false): Promise<Course[]> {
    console.log('📚 Courses: Getting courses, includeInactive:', includeInactive);

    let query = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    return supabaseRequest(() => query, 'getCourses');
  },

  async getCourse(id: string): Promise<Course> {
    console.log('📚 Courses: Getting course:', id);

    return supabaseRequest(() => supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single(), 'getCourse');
  },

  async createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    console.log('📚 Courses: Creating course:', course.title);

    return supabaseRequest(() => supabase
      .from('courses')
      .insert(course)
      .select()
      .single(), 'createCourse');
  },

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    console.log('📚 Courses: Updating course:', id);

    return supabaseRequest(() => supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateCourse');
  },

  // Course Modules
  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    console.log('📚 Courses: Getting modules for course:', courseId);

    return supabaseRequest(() => supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index'), 'getCourseModules');
  },

  async createModule(module: Omit<CourseModule, 'id' | 'created_at'>): Promise<CourseModule> {
    console.log('📚 Courses: Creating module:', module.title);

    return supabaseRequest(() => supabase
      .from('course_modules')
      .insert(module)
      .select()
      .single(), 'createCourseModule');
  },

  // Enrollments
  async getUserEnrollments(profileId: string): Promise<CourseEnrollment[]> {
    console.log('📚 Courses: Getting enrollments for profile:', profileId);

    return supabaseRequest(() => supabase
      .from('course_enrollments')
      .select(`
        *,
        course:courses(title, instructor, points)
      `)
      .eq('profile_id', profileId)
      .order('enrolled_at', { ascending: false }), 'getUserEnrollments');
  },

  async enrollInCourse(courseId: string, profileId: string): Promise<CourseEnrollment> {
    console.log('📚 Courses: Enrolling profile in course:', { courseId, profileId });

    return supabaseRequest(() => supabase
      .from('course_enrollments')
      .insert({
        course_id: courseId,
        profile_id: profileId,
        status: 'enrolled'
      })
      .select()
      .single(), 'enrollInCourse');
  },

  async getEnrollment(courseId: string, profileId: string): Promise<CourseEnrollment | null> {
    console.log('📚 Courses: Getting enrollment:', { courseId, profileId });

    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('📚 Courses: Error getting enrollment:', error);
      return null;
    }
  },

  // Progress Tracking
  async getModuleProgress(enrollmentId: string): Promise<CourseProgress[]> {
    console.log('📚 Courses: Getting module progress for enrollment:', enrollmentId);

    return supabaseRequest(() => supabase
      .from('course_progress')
      .select(`
        *,
        module:course_modules(title, order_index)
      `)
      .eq('enrollment_id', enrollmentId)
      .order('completed_at'), 'getModuleProgress');
  },

  async completeModule(enrollmentId: string, moduleId: string, timeSpent = 0): Promise<CourseProgress> {
    console.log('📚 Courses: Completing module:', { enrollmentId, moduleId, timeSpent });

    return supabaseRequest(() => supabase
      .from('course_progress')
      .insert({
        enrollment_id: enrollmentId,
        module_id: moduleId,
        time_spent_minutes: timeSpent
      })
      .select()
      .single(), 'completeModule');
  },

  async getCoursesWithProgress(profileId: string): Promise<CourseWithProgress[]> {
    console.log('📚 Courses: Getting courses with progress for profile:', profileId);

    try {
      // Get all active courses
      const courses = await this.getCourses();
      
      // Get user enrollments
      const enrollments = await this.getUserEnrollments(profileId);
      const enrollmentMap = new Map(enrollments.map(e => [e.course_id, e]));

      // Combine courses with enrollment data
      const coursesWithProgress: CourseWithProgress[] = await Promise.all(
        courses.map(async (course) => {
          const enrollment = enrollmentMap.get(course.id);
          const modules = await this.getCourseModules(course.id);
          
          let completed_modules = 0;
          if (enrollment) {
            const progress = await this.getModuleProgress(enrollment.id);
            completed_modules = progress.length;
          }

          return {
            ...course,
            enrollment,
            modules,
            completed_modules,
            total_modules: modules.length
          };
        })
      );

      console.log('📚 Courses: Courses with progress loaded:', coursesWithProgress.length);
      return coursesWithProgress;
    } catch (error) {
      console.error('📚 Courses: Error getting courses with progress:', error);
      throw error;
    }
  },

  // Certificates
  async getUserCertificates(profileId: string): Promise<Certificate[]> {
    console.log('📚 Courses: Getting certificates for profile:', profileId);

    return supabaseRequest(() => supabase
      .from('certificates')
      .select(`
        *,
        course:courses(title, instructor)
      `)
      .eq('profile_id', profileId)
      .order('issued_at', { ascending: false }), 'getUserCertificates');
  },

  async getCertificate(id: string): Promise<Certificate> {
    console.log('📚 Courses: Getting certificate:', id);

    return supabaseRequest(() => supabase
      .from('certificates')
      .select(`
        *,
        course:courses(title, instructor, category),
        profile:profiles(name, email)
      `)
      .eq('id', id)
      .single(), 'getCertificate');
  },

  async verifyCertificate(verificationCode: string): Promise<Certificate | null> {
    console.log('📚 Courses: Verifying certificate:', verificationCode);

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          course:courses(title, instructor),
          profile:profiles(name)
        `)
        .eq('verification_code', verificationCode)
        .eq('is_valid', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('📚 Courses: Error verifying certificate:', error);
      return null;
    }
  },

  // Certificate Generation
  generateCertificateHTML(certificate: any): string {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Certificado - ${certificate.course.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
          
          body {
            margin: 0;
            padding: 40px;
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .certificate {
            background: white;
            width: 800px;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .certificate::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #3B82F6, #10B981, #F59E0B, #EF4444);
          }
          
          .header {
            margin-bottom: 40px;
          }
          
          .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #3B82F6, #8B5CF6);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
          }
          
          .title {
            font-family: 'Playfair Display', serif;
            font-size: 48px;
            font-weight: 700;
            color: #1F2937;
            margin-bottom: 10px;
          }
          
          .subtitle {
            font-size: 18px;
            color: #6B7280;
            font-weight: 500;
          }
          
          .recipient {
            margin: 40px 0;
            padding: 30px;
            background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
            border-radius: 15px;
          }
          
          .recipient-label {
            font-size: 16px;
            color: #6B7280;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          
          .recipient-name {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 700;
            color: #1F2937;
            margin-bottom: 20px;
          }
          
          .course-info {
            margin: 40px 0;
          }
          
          .course-title {
            font-size: 24px;
            font-weight: 600;
            color: #3B82F6;
            margin-bottom: 10px;
          }
          
          .course-details {
            font-size: 16px;
            color: #6B7280;
            line-height: 1.6;
          }
          
          .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: end;
          }
          
          .signature {
            text-align: center;
          }
          
          .signature-line {
            width: 200px;
            height: 2px;
            background: #D1D5DB;
            margin: 0 auto 10px;
          }
          
          .signature-name {
            font-weight: 600;
            color: #1F2937;
          }
          
          .signature-title {
            font-size: 14px;
            color: #6B7280;
          }
          
          .certificate-info {
            text-align: right;
            font-size: 12px;
            color: #9CA3AF;
          }
          
          .verification {
            margin-top: 30px;
            padding: 20px;
            background: #F9FAFB;
            border-radius: 10px;
            border: 2px dashed #D1D5DB;
          }
          
          .verification-title {
            font-weight: 600;
            color: #1F2937;
            margin-bottom: 5px;
          }
          
          .verification-code {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #3B82F6;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <div class="logo">🏆</div>
            <h1 class="title">Certificado</h1>
            <p class="subtitle">de Conclusão de Curso</p>
          </div>
          
          <div class="recipient">
            <p class="recipient-label">Certificamos que</p>
            <h2 class="recipient-name">${certificate.profile.name}</h2>
            <p class="course-details">concluiu com êxito o curso</p>
          </div>
          
          <div class="course-info">
            <h3 class="course-title">${certificate.course.title}</h3>
            <div class="course-details">
              <p>Ministrado por <strong>${certificate.course.instructor}</strong></p>
              <p>Carga horária: <strong>${Math.floor(certificate.course?.duration_minutes / 60)}h ${certificate.course?.duration_minutes % 60}min</strong></p>
              <p>Categoria: <strong>${this.getCategoryLabel(certificate.course.category)}</strong></p>
            </div>
          </div>
          
          <div class="footer">
            <div class="signature">
              <div class="signature-line"></div>
              <p class="signature-name">${certificate.course.instructor}</p>
              <p class="signature-title">Instrutor</p>
            </div>
            
            <div class="certificate-info">
              <p><strong>Certificado Nº:</strong> ${certificate.certificate_number}</p>
              <p><strong>Data de Emissão:</strong> ${currentDate}</p>
              <p><strong>TalentFlow</strong> - Sistema de Desenvolvimento</p>
            </div>
          </div>
          
          <div class="verification">
            <p class="verification-title">Código de Verificação</p>
            <p class="verification-code">${certificate.verification_code}</p>
            <p style="font-size: 12px; color: #6B7280; margin-top: 5px;">
              Verifique a autenticidade em: talentflow.com/verify
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'technical': return 'Técnico';
      case 'soft-skills': return 'Soft Skills';
      case 'leadership': return 'Liderança';
      case 'compliance': return 'Compliance';
      default: return category;
    }
  },

  async generateCertificatePDF(certificateId: string): Promise<string> {
    console.log('📚 Courses: Generating PDF for certificate:', certificateId);

    try {
      const certificate = await this.getCertificate(certificateId);
      const html = this.generateCertificateHTML(certificate);
      
      // In a real implementation, you would use a service like Puppeteer or similar
      // For now, we'll return the HTML content as a data URL
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Update certificate with PDF URL
      await supabase
        .from('certificates')
        .update({ pdf_url: url })
        .eq('id', certificateId);
      
      return url;
    } catch (error) {
      console.error('📚 Courses: Error generating PDF:', error);
      throw error;
    }
  },

  // Progress Management
  async startCourse(courseId: string, profileId: string): Promise<CourseEnrollment> {
    console.log('📚 Courses: Starting course:', { courseId, profileId });

    try {
      // Check if already enrolled
      let enrollment = await this.getEnrollment(courseId, profileId);
      
      if (!enrollment) {
        enrollment = await this.enrollInCourse(courseId, profileId);
      }

      // Update to in-progress if not already
      if (enrollment.status === 'enrolled') {
        const { data, error } = await supabase
          .from('course_enrollments')
          .update({ 
            status: 'in-progress',
            started_at: new Date().toISOString()
          })
          .eq('id', enrollment.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      return enrollment;
    } catch (error) {
      console.error('📚 Courses: Error starting course:', error);
      throw error;
    }
  },

  async completeModule(enrollmentId: string, moduleId: string, timeSpent = 0): Promise<void> {
    console.log('📚 Courses: Completing module:', { enrollmentId, moduleId, timeSpent });

    try {
      // Check if already completed
      const { data: existing } = await supabase
        .from('course_progress')
        .select('id')
        .eq('enrollment_id', enrollmentId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (existing) {
        console.log('📚 Courses: Module already completed');
        return;
      }

      // Mark module as completed
      await supabaseRequest(() => supabase
        .from('course_progress')
        .insert({
          enrollment_id: enrollmentId,
          module_id: moduleId,
          time_spent_minutes: timeSpent
        }), 'completeModule');

      console.log('📚 Courses: Module completed successfully');
    } catch (error) {
      console.error('📚 Courses: Error completing module:', error);
      throw error;
    }
  },

  // Certificate Generation
  async generateCertificate(enrollmentId: string): Promise<string> {
    console.log('📚 Courses: Generating certificate for enrollment:', enrollmentId);

    try {
      const { data, error } = await supabase.rpc('generate_course_certificate', {
        enrollment_id_param: enrollmentId
      });

      if (error) {
        console.error('📚 Courses: Error generating certificate:', error);
        throw error;
      }

      console.log('📚 Courses: Certificate generated:', data);
      return data;
    } catch (error) {
      console.error('📚 Courses: Critical error generating certificate:', error);
      throw error;
    }
  },

  async getCertificate(id: string): Promise<any> {
    console.log('📚 Courses: Getting certificate:', id);

    return supabaseRequest(() => supabase
      .from('certificates')
      .select(`
        *,
        course:courses(title, instructor, category, duration_minutes),
        profile:profiles(name, email)
      `)
      .eq('id', id)
      .single(), 'getCertificate');
  },

  async getCourseWithProgress(courseId: string, profileId: string): Promise<CourseWithProgress> {
    console.log('📚 Courses: Getting course with progress:', { courseId, profileId });

    try {
      const [course, modules, enrollment] = await Promise.all([
        this.getCourse(courseId),
        this.getCourseModules(courseId),
        this.getEnrollment(courseId, profileId)
      ]);

      let completed_modules = 0;
      if (enrollment) {
        const progress = await this.getModuleProgress(enrollment.id);
        completed_modules = progress.length;
      }

      return {
        ...course,
        enrollment,
        modules,
        completed_modules,
        total_modules: modules.length
      };
    } catch (error) {
      console.error('📚 Courses: Error getting course with progress:', error);
      throw error;
    }
  }
};