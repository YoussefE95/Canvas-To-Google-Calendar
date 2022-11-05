const DOMAIN = "https://calstatela.instructure.com/api/v1";
const TOKEN = "Bearer ";

browser.browserAction.onClicked.addListener(async () => {
  try {
    const self = await getSelf();
    const courses = await getCourses();
    const assignments = await getAssignments(self.id, courses);
    const assignmentsDue = await filterAssignments(assignments.flat());
    console.log(assignmentsDue);
  } catch (error) {
    console.log(error);
  }
});

const getSelf = async () => {
  try {
    const response = await fetch(`${DOMAIN}/users/self`, {
      method: "GET",
      mode: "cors",
      headers: {
        authorization: `${TOKEN}`,
      },
    });
    const body = await response.json();
    return body;
  } catch (error) {
    console.log(error);
  }
};

const getCourses = async () => {
  try {
    const response = await fetch(`${DOMAIN}/courses?enrollment_state=active`, {
      method: "GET",
      mode: "cors",
      headers: {
        authorization: `${TOKEN}`,
      },
    });
    const body = await response.json();
    return body;
  } catch (error) {
    console.log(error);
  }
};

const getCourseIds = (courses) => {
  const ids = [];
  courses.forEach((course) => {
    ids.push(course.id);
  });
  return ids;
};

async function getAssignments(selfId, courses) {
  const courseIds = getCourseIds(courses);
  const promises = courseIds.map((id) => getAssignmentsByCourse(selfId, id));
  const assignments = await Promise.all(promises);

  return assignments;
}

const filterAssignments = async (assignments) => {
  const currentDate = new Date();
  const filtered = assignments.filter(
    (assignment) => currentDate <= new Date(assignment.due_at)
  );
  return filtered;
};

const getAssignmentsByCourse = async (selfId, courseId) => {
  const res = await fetch(
    `${DOMAIN}/users/${selfId}/courses/${courseId}/assignments`,
    {
      method: "GET",
      mode: "cors",
      headers: {
        authorization: `${TOKEN}`,
      },
    }
  );
  const body = await res.json();
  return body;
};
