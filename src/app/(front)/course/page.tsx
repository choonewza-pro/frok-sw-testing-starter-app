import FeaturesCourse from "@/components/features-course";
import { CourseApiError, fetchCourses } from "@/lib/course/course-api";
import type { Course } from "@/types/course";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// http://localhost:3000/course
export default async function CoursePage() {
  let courses: Course[] = [];
  let errorMessage: string | null = null;

  try {
    courses = await fetchCourses();
  } catch (error) {
    errorMessage =
      error instanceof CourseApiError
        ? error.message
        : "ไม่สามารถโหลดข้อมูลหลักสูตรได้";
  }

  return (
    <main>
      <FeaturesCourse courses={courses} errorMessage={errorMessage} />
    </main>
  );
}
