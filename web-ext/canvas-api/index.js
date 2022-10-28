process.env.CANVAS_API_DOMAIN = '';
process.env.CANVAS_API_TOKEN = '';

const canvasAPI = require('node-canvas-api');

const getAssignments = async () => {
    try {
        const self = await canvasAPI.getSelf();
        const courses = await canvasAPI.getCoursesByUser(self.id);
        const currentDate = new Date();
        const assignments = [];
    
        courses.forEach(async (course) => {
            if(!course.access_restricted_by_date) {
                const courseAssignments = await canvasAPI.getAssignments(course.id);
    
                courseAssignments.forEach((assignment) => {
                    if(assignment.due_at) {
                        const dueDate = new Date(assignment.due_at);
    
                        if(currentDate < dueDate) {
                            console.log(assignment.name, course.course_code, dueDate);
                            assignments.push({
                                "name": assignment.name,
                                "class": course.course_code,
                                "due": dueDate,
                            });
                        }
                    }
                });
            }
        });
    
        return assignments;
    } catch(err) {
        console.log(err);
    }
};

console.log(getAssignments());