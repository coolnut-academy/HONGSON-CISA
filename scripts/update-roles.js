/**
 * Script to update all user roles to 'student'
 * Except for super admin email: satitsiriwach@gmail.com
 * 
 * Run with: node scripts/update-roles.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check for service account file
const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');

let serviceAccount;
try {
    const rawData = readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(rawData);
    console.log('✓ Found serviceAccountKey.json');
} catch (error) {
    console.error('❌ Error: serviceAccountKey.json not found!');
    console.log('\n📋 How to get it:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/hongson-cisa/settings/serviceaccounts/adminsdk');
    console.log('2. Click "Generate new private key"');
    console.log('3. Save the file as "serviceAccountKey.json" in the project root folder');
    console.log('4. Run this script again\n');
    process.exit(1);
}

const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore(app);

const SUPER_ADMIN_EMAIL = 'satitsiriwach@gmail.com';

async function updateAllRoles() {
    console.log('🚀 Starting role update...\n');

    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();

        if (snapshot.empty) {
            console.log('❌ No users found in the database.');
            process.exit(0);
        }

        console.log(`📊 Found ${snapshot.size} users\n`);

        let updatedCount = 0;
        let skippedCount = 0;
        let superAdminFound = false;

        const batch = db.batch();

        snapshot.forEach((doc) => {
            const userData = doc.data();
            const email = userData.email || '';
            const currentRole = userData.role;

            if (email === SUPER_ADMIN_EMAIL) {
                // Keep super_admin for this email
                if (currentRole !== 'super_admin') {
                    batch.update(doc.ref, { role: 'super_admin' });
                    console.log(`👑 ${email}: ${currentRole} → super_admin (PROMOTED)`);
                    updatedCount++;
                } else {
                    console.log(`👑 ${email}: super_admin (KEPT)`);
                    skippedCount++;
                }
                superAdminFound = true;
            } else {
                // Update to student if not already
                if (currentRole !== 'student') {
                    batch.update(doc.ref, { role: 'student' });
                    console.log(`📝 ${email}: ${currentRole} → student`);
                    updatedCount++;
                } else {
                    console.log(`✓  ${email}: student (already correct)`);
                    skippedCount++;
                }
            }
        });

        if (updatedCount > 0) {
            await batch.commit();
            console.log(`\n✅ Successfully updated ${updatedCount} users!`);
        } else {
            console.log('\n✅ No updates needed - all roles are correct!');
        }

        console.log(`📊 Summary:`);
        console.log(`   - Updated: ${updatedCount}`);
        console.log(`   - Skipped (already correct): ${skippedCount}`);
        console.log(`   - Super Admin (${SUPER_ADMIN_EMAIL}): ${superAdminFound ? 'Found ✓' : 'Not found ⚠️'}`);

        if (!superAdminFound) {
            console.log(`\n⚠️  Warning: ${SUPER_ADMIN_EMAIL} was not found in the database.`);
            console.log('   Make sure this account logs in at least once to be created.');
        }

    } catch (error) {
        console.error('❌ Error updating roles:', error.message);
    }

    process.exit(0);
}

updateAllRoles();
