import fs from 'fs';
import path from 'path';

const files = [
  'node_modules/@capacitor/android/capacitor/build.gradle',
  'node_modules/@capacitor/app/android/build.gradle',
  'node_modules/@capacitor/haptics/android/build.gradle',
  'node_modules/@capacitor/preferences/android/build.gradle',
  'node_modules/@capacitor-community/admob/android/build.gradle'
];

for (const rel of files) {
  const p = path.resolve(process.cwd(), rel);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    let modified = false;
    if (content.includes('JavaVersion.VERSION_21')) {
      content = content.replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17');
      modified = true;
    }
    if (content.includes("jvmTarget = JavaVersion.VERSION_21") || content.includes("jvmTarget = '21'")) {
      content = content.replace(/jvmTarget\s*=\s*.*/g, "jvmTarget = '17'");
      modified = true;
    }
    if (modified) {
      fs.writeFileSync(p, content, 'utf8');
      console.log(`[Patch] Updated ${rel} to Java 17`);
    }
  }
}
