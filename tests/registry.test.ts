import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { validateStudentUpdates } from '../src/lib/student-updates.js';
import { validateStudentForm } from '../src/lib/validation.js';

// Tests must never connect to production data.
delete process.env.DATABASE_URL;
process.env.FACULTY_JWT_SECRET = 'test-only-secret-not-for-deployment';
process.env.FACULTY_PASSWORD_ALL = 'test-admin-password';
process.env.FACULTY_PASSWORD_CSE = 'test-cse-password';
const faculty = await import('../server/faculty.js');
const {db} = await import('../server/db.js');
const {default: update} = await import('../api/faculty/update.js');
const {default: remove} = await import('../api/faculty/delete.js');
const {default: exportStudents} = await import('../api/faculty/export.js');
const {default: list} = await import('../api/faculty/students.js');
const fixture: any = {firstName:'TEST',lastName:'',rollNumber:'TEST001',dateOfBirth:'2005-01-01',gender:'Other',email:'fixture@example.com',emailVerified:true,mobileNumber:'9000000000',aadharNumber:'000000000000',panNumber:'',passportNumber:'',college:'TEST COLLEGE',branch:'CSE – Artificial Intelligence & Machine Learning',otherBranch:'',cgpa:7.31,percentage:68.1,activeBacklogs:0,intermediateOrDiploma:'Intermediate',intermediateCgpa:8,intermediatePercentage:80,intermediateYearOfPassing:'2023',btechYearOfPassing:'2027',tenthCgpa:9,tenthPercentage:90,tenthYearOfPassing:'2021',crtRegistration:'Registered',githubLink:'https://github.com/example'};
function response() { return {code:200,body:undefined as any,headers:{} as any,status(n:number){this.code=n;return this},json(v:any){this.body=v;return this},send(v:any){this.body=v;return this},setHeader(k:string,v:any){this.headers[k]=v;return this}}; }
function request(method:string,dept:string,body?:any,query:any={}) {return {method,headers:{authorization:`Bearer ${faculty.createFacultyToken(dept)}`},body,query};}

test('single-name correction preserves every unrelated field and rejects immutable input', () => {
  const existing = {first_name:'Samatha', last_name:'', cgpa:7.31, percentage:68.1, aadhar_number:'000000000000'};
  const result = validateStudentUpdates(existing,{first_name:'SAMATHA'});
  assert.deepEqual(result.errors,{});
  assert.deepEqual(result.updates,{first_name:'SAMATHA'});
  assert.ok(validateStudentUpdates(existing,{email_verified:true}).errors.email_verified);
});
test('CGPA changes recompute percentages, including zero, and reject invalid values', () => {
  assert.deepEqual(validateStudentUpdates({}, {cgpa:8}).updates, {cgpa:8,percentage:75});
  assert.deepEqual(validateStudentUpdates({}, {tenth_cgpa:0}).updates,{tenth_cgpa:0,tenth_percentage:0});
  for (const value of [-1,11,NaN,'8junk',null]) assert.ok(validateStudentUpdates({cgpa:7}, {cgpa:value}).errors.cgpa);
});
test('years and profile URLs validate on changed fields', () => {
  assert.ok(validateStudentUpdates({}, {tenth_year_of_passing:'2099'}).errors.tenthYearOfPassing);
  assert.ok(validateStudentUpdates({tenth_year_of_passing:'2023'}, {intermediate_year_of_passing:'2022'}).errors.intermediateYearOfPassing);
  assert.ok(validateStudentUpdates({}, {github_link:'javascript:alert(1)'}).errors.githubLink);
  assert.deepEqual(validateStudentUpdates({email:'old@example.com'}, {email:'new@example.com'}).updates,{email:'new@example.com', email_verified:false});
});
test('single names and initials are accepted on the registration form', () => {
  const data:any = Object.fromEntries(Object.entries({...fixture,firstName:'A',diplomaCgpa:'',diplomaPercentage:''}).map(([k,v])=>[k,String(v)]));
  data.activeBacklogs=0;
  assert.deepEqual(validateStudentForm(data,true).errors,{});
});
test('tokens reject tampering, extra segments and cross-department credentials', () => {
  const token=faculty.createFacultyToken('CSE');
  assert.deepEqual(faculty.verifyFacultyToken(token),{dept:'CSE'});
  assert.equal(faculty.verifyFacultyToken(token+'.extra'),null);
  assert.equal(faculty.verifyFacultyToken(token.slice(0,-1)+'!'),null);
  assert.equal(faculty.verifyFacultyCredentials('CSE','test-cse-password'),true);
  assert.equal(faculty.verifyFacultyCredentials('ALL','test-cse-password'),false);
  assert.equal(faculty.verifyFacultyCredentials('ECE','test-admin-password'),false);
});
test('scoped list/export includes truncated and complete AI&ML branches and filters year', async () => {
  await db.insertStudent(fixture);
  await db.insertStudent({...fixture,rollNumber:'TEST002',email:'fixture2@example.com',branch:faculty.DEPARTMENTS['CSE-AIML'].name});
  await db.insertStudent({...fixture,rollNumber:'TEST003',email:'fixture3@example.com',branch:'CSE'});
  const out=response();await list(request('GET','CSE-AIML',undefined,{branch:'ALL',yop:'2027'}),out);
  assert.equal(out.body.count,2);
  const exported=response();await exportStudents(request('GET','CSE-AIML',undefined,{branch:'ALL',yop:'2027'}),exported);
  assert.equal(exported.code,200);
  const workbook=XLSX.read(exported.body,{type:'buffer'});
  const rows:any[]=XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  assert.equal(rows.length,2);assert.equal(rows[0]['Full Name'],'TEST');assert.equal(rows[0]['10th Year of Passing'],'2021');assert.equal(rows[0].GitHub,fixture.githubLink);
  const wrongYear=response();await list(request('GET','CSE-AIML',undefined,{yop:'2028'}),wrongYear);assert.equal(wrongYear.body.count,0);
});
test('updates/deletes deny other departments and name-only update preserves identifiers and marks', async () => {
  const original=await db.findStudentByRollNumber('TEST001');assert.ok(original);
  const forbidden=response();await update(request('PUT','CSE',{id:original.id,updates:{first_name:'OTHER'}}),forbidden);assert.equal(forbidden.code,403);
  const forbiddenDelete=response();await remove(request('DELETE','CSE',{id:original.id}),forbiddenDelete);assert.equal(forbiddenDelete.code,403);
  const saved=response();await update(request('PUT','ALL',{id:original.id,updates:{first_name:'UPDATED'}}),saved);assert.equal(saved.code,200);
  const reloaded=await db.findStudentById(original.id);assert.ok(reloaded);
  for (const key of Object.keys(original)) if (!['first_name','updated_at'].includes(key)) assert.deepEqual(reloaded[key as keyof typeof reloaded],original[key as keyof typeof original],key);
  assert.equal(reloaded.first_name,'UPDATED');
  const grades=response();await update(request('PATCH','ALL',{id:original.id,updates:{cgpa:8}}),grades);assert.equal(grades.body.student.percentage,75);
});
test('export refuses old query-string authentication', async () => {
  const out=response();await exportStudents({method:'GET',headers:{},query:{token:faculty.createFacultyToken('ALL')}},out);assert.equal(out.code,401);
});

test('rendered year choices allow expected B.Tech graduation but no future completed education', async () => {
  const {createElement} = await import('react');
  const {renderToStaticMarkup} = await import('react-dom/server');
  const {AcademicDetailsSection} = await import('../src/components/AcademicDetailsSection.js');
  const html = renderToStaticMarkup(createElement(AcademicDetailsSection, {...fixture, onChange: () => {}, errors: {}}));
  const options = (id: string) => html.match(new RegExp(`<select id="${id}"[^>]*>([\\s\\S]*?)</select>`))?.[1] || '';
  const nextYear = String(new Date().getFullYear() + 1);
  assert.ok(options('btechYearOfPassing').includes(`value="${nextYear}"`));
  assert.ok(!options('tenthYearOfPassing').includes(`value="${nextYear}"`));
  assert.ok(!options('intermediateYearOfPassing').includes(`value="${nextYear}"`));
});

test('registration saves full departments/profiles, uppercases names and consumes verification', async () => {
  const {createHash} = await import('node:crypto');
  const {default: submit} = await import('../api/students/submit.js');
  const email='registration@example.com';
  const token='a'.repeat(64);
  const otp=await db.saveOtp(email,'synthetic-test-hash',new Date());
  await db.markOtpVerified(otp.id,createHash('sha256').update(token).digest('hex'),new Date(Date.now()+60000));
  const body={...fixture,email,rollNumber:'NEW001',firstName:'new student',lastName:'',branch:faculty.DEPARTMENTS['CSE-AIML'].name,verificationToken:token};
  const out=response();await submit({method:'POST',body},out);
  assert.equal(out.code,201,JSON.stringify(out.body));
  const saved=await db.findStudentById(out.body.submissionId);assert.ok(saved);
  assert.equal(saved.first_name,'NEW STUDENT');assert.equal(saved.last_name,'');
  assert.equal(saved.branch,body.branch);assert.equal(saved.github_link,body.githubLink);
  assert.equal(saved.aadhar_number,body.aadharNumber);assert.equal(saved.percentage,body.percentage);
  const replay=response();await submit({method:'POST',body:{...body,rollNumber:'NEW002'}},replay);
  assert.equal(replay.code,400);assert.ok(replay.body.errors.email);
  assert.equal(await db.findStudentByRollNumber('NEW002'),null);
});
test('registration rejects duplicate roll before writing another record', async () => {
  const {createHash} = await import('node:crypto');
  const {default: submit} = await import('../api/students/submit.js');
  const email='duplicate@example.com';const token='b'.repeat(64);
  const otp=await db.saveOtp(email,'synthetic-test-hash',new Date());
  await db.markOtpVerified(otp.id,createHash('sha256').update(token).digest('hex'),new Date(Date.now()+60000));
  const out=response();await submit({method:'POST',body:{...fixture,email,rollNumber:'TEST001',verificationToken:token}},out);
  assert.equal(out.code,400);assert.ok(out.body.errors.rollNumber);
});
test('registration rejects malformed input and never leaks database details', async () => {
  const {default: submit} = await import('../api/students/submit.js');
  for(const body of [null, [], '{', {...fixture,firstName:{bad:true}}, {...fixture,aadharNumber:'123'}, {...fixture,cgpa:'8junk'}]) {
    const out=response();await submit({method:'POST',body},out);assert.equal(out.code,400);assert.equal(out.body.errorDetails,undefined);
  }
});
test('faculty APIs require authentication and enforce methods', async () => {
  for(const [handler,method] of [[update,'PUT'],[remove,'DELETE'],[list,'GET'],[exportStudents,'GET']] as const) {
    const out=response();await handler({method,headers:{},query:{},body:{}},out);assert.equal(out.code,401);
    const wrongMethod=response();await handler(request('POST','ALL',{}),wrongMethod);assert.equal(wrongMethod.code,405);
  }
});
test('department transfers are denied and malformed updates preserve existing data', async () => {
  const original=await db.findStudentByRollNumber('TEST003');assert.ok(original);
  const denied=response();await update(request('PUT','CSE',{id:original.id,updates:{branch:'ECE'}}),denied);assert.equal(denied.code,403);
  for(const patch of [{aadhar_number:'123'},{mobile_number:'123'},{active_backlogs:-1},{active_backlogs:1.5},{email:'not-email'},{first_name:''},{branch:'nonsense'}]) {
    const out=response();await update(request('PUT','ALL',{id:original.id,updates:patch}),out);assert.equal(out.code,400,JSON.stringify(patch));
  }
  assert.deepEqual(await db.findStudentById(original.id),original);
});
test('expired verification tokens fail without sending any email', async () => {
  const {createHash} = await import('node:crypto');
  const {validateVerificationToken} = await import('../server/otp.js');
  const token='c'.repeat(64);const email='expired@example.com';
  const otp=await db.saveOtp(email,'synthetic-test-hash',new Date());
  await db.markOtpVerified(otp.id,createHash('sha256').update(token).digest('hex'),new Date(Date.now()-1000));
  assert.equal(await validateVerificationToken(email,token),false);
});
