import { execSync } from 'child_process';
try {
  const out = execSync('npm run build', { cwd: 'g:/Languages/Projects/Healthcare AI/R1/frontend-react', encoding: 'utf-8' });
  console.log("BUILD SUCCESS");
  console.log(out);
} catch (e) {
  console.log("BUILD FAILED");
  console.log(e.stdout);
  console.log(e.stderr);
}
