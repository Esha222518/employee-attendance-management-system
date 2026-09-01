// Seeds the database with a demo HR account and a few employees.
// Run with: npm run seed
require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");

const seed = async () => {
  await connectDB();

  await User.deleteMany({ email: { $in: ["hr@company.com", "john@company.com", "priya@company.com"] } });

  const hr = await User.create({
    name: "HR Admin",
    email: "hr@company.com",
    password: "HrAdmin@123",
    role: "hr",
    department: "Human Resources",
    designation: "HR Manager",
    employeeId: "HR001",
  });

  const john = await User.create({
    name: "John Mathew",
    email: "john@company.com",
    password: "JohnDev@123",
    role: "employee",
    department: "Engineering",
    designation: "Software Developer",
    employeeId: "EMP001",
    monthlySalary: 35000,
  });

  const priya = await User.create({
    name: "Priya Sharma",
    email: "priya@company.com",
    password: "PriyaUX@123",
    role: "employee",
    department: "Design",
    designation: "UI/UX Designer",
    employeeId: "EMP002",
    monthlySalary: 32000,
  });

  console.log("Seed complete. Demo accounts:");
  console.log(" HR:       hr@company.com / HrAdmin@123");
  console.log(" Employee: john@company.com / JohnDev@123");
  console.log(" Employee: priya@company.com / PriyaUX@123");
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
