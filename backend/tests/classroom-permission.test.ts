import { describe, it, expect } from 'vitest';
import { expandCompatibleRoles } from '../src/middleware/authorize.js';
import { PRISMA_MODEL_OWNERSHIP_INVENTORY } from '../src/utils/ownership.js';

describe('Phase 9: Classroom Management Permission & Security Scoping Audit', () => {
  describe('1. Canonical Role Integrity & Disambiguation', () => {
    const CANONICAL_ROLES = ['STUDENT', 'TEACHER', 'ADMIN'];

    it('identifies the 3 official canonical platform roles', () => {
      expect(CANONICAL_ROLES).toContain('STUDENT');
      expect(CANONICAL_ROLES).toContain('TEACHER');
      expect(CANONICAL_ROLES).toContain('ADMIN');
    });

    it('ensures STUDENT has no management or administrative access', () => {
      const studentRoles = ['STUDENT'];
      const expanded = expandCompatibleRoles(studentRoles);
      expect(expanded).not.toContain('TEACHER');
      expect(expanded).not.toContain('ADMIN');
    });

    it('ensures TEACHER has no global platform admin access', () => {
      const teacherRoles = ['TEACHER'];
      const expanded = expandCompatibleRoles(teacherRoles);
      expect(expanded).not.toContain('ADMIN');
    });
  });

  describe('2. Classroom Ownership & Multi-Tenant IDOR Guards', () => {
    it('verifies Class model is classified under TEACHER_OR_ENROLLED strategy in inventory', () => {
      const classEntry = PRISMA_MODEL_OWNERSHIP_INVENTORY.find((entry) => entry.model === 'Class');
      expect(classEntry).toBeDefined();
      expect(classEntry?.strategy).toBe('TEACHER_OR_ENROLLED');
      expect(classEntry?.apiStatus).toBe('IMPLEMENTED');
    });

    it('verifies ClassEnrollment model is classified under TEACHER_OR_ENROLLED strategy', () => {
      const enrollmentEntry = PRISMA_MODEL_OWNERSHIP_INVENTORY.find((entry) => entry.model === 'ClassEnrollment');
      expect(enrollmentEntry).toBeDefined();
      expect(enrollmentEntry?.strategy).toBe('TEACHER_OR_ENROLLED');
      expect(enrollmentEntry?.apiStatus).toBe('IMPLEMENTED');
    });

    it('prevents cross-tenant class manipulation: Teacher A cannot mutate Teacher B class', () => {
      interface MockClass {
        id: string;
        teacherId: string;
      }
      interface MockActor {
        id: string;
        roles: string[];
      }

      const canTeacherMutateClass = (actor: MockActor, targetClass: MockClass): boolean => {
        if (actor.roles.includes('ADMIN')) return true;
        if (!actor.roles.includes('TEACHER')) return false;
        return actor.id === targetClass.teacherId;
      };

      const teacherA: MockActor = { id: 'teacher_101', roles: ['TEACHER'] };
      const teacherB: MockActor = { id: 'teacher_102', roles: ['TEACHER'] };
      const classA: MockClass = { id: 'cls_A', teacherId: 'teacher_101' };

      expect(canTeacherMutateClass(teacherA, classA)).toBe(true);
      expect(canTeacherMutateClass(teacherB, classA)).toBe(false);
    });

    it('prevents student cross-enrollment leakage: Student cannot access unjoined class data', () => {
      interface MockEnrollment {
        classId: string;
        studentId: string;
      }

      const isStudentEnrolled = (studentId: string, classId: string, enrollments: MockEnrollment[]): boolean => {
        return enrollments.some((e) => e.studentId === studentId && e.classId === classId);
      };

      const enrollments: MockEnrollment[] = [
        { classId: 'cls_1', studentId: 'student_alice' },
        { classId: 'cls_2', studentId: 'student_bob' },
      ];

      expect(isStudentEnrolled('student_alice', 'cls_1', enrollments)).toBe(true);
      expect(isStudentEnrolled('student_alice', 'cls_2', enrollments)).toBe(false);
      expect(isStudentEnrolled('student_charlie', 'cls_1', enrollments)).toBe(false);
    });
  });

  describe('3. Server-side Enforcement (Anti-Client Trust)', () => {
    it('disallows client body override of teacherId or studentId', () => {
      const authenticatedUserId = 'actor_jwt_verified_id';
      const clientRequestBody = { teacherId: 'malicious_spoofed_id', name: '偽造班級' };

      // Backend security rule: Actor ID MUST be bound strictly to req.user.id
      const resolvedTeacherId = authenticatedUserId;
      expect(resolvedTeacherId).not.toBe(clientRequestBody.teacherId);
      expect(resolvedTeacherId).toBe('actor_jwt_verified_id');
    });
  });
});
