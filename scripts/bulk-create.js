/**
 * Simple script to test Firebase Admin SDK
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
console.log('Loading from:', serviceAccountPath);

if (!fs.existsSync(serviceAccountPath)) {
    console.error('serviceAccountKey.json not found!');
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function main() {
    console.log('🚀 Starting bulk account creation...\n');

    // Get pre-registered students
    const snapshot = await db.collection('pre_registered_students').get();

    if (snapshot.empty) {
        console.log('❌ No pre-registered students found.');
        process.exit(0);
    }

    console.log(`📊 Found ${snapshot.size} pre-registered students\n`);

    let created = 0, exists = 0, errors = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const studentId = data.studentId || doc.id;
        const email = `${studentId}@hongsoncisa.com`;
        const password = `hongsoncisa${studentId}`;

        try {
            // Check if user exists
            try {
                const existing = await auth.getUserByEmail(email);
                console.log(`⏭️  ${studentId}: Already exists`);
                exists++;

                // Update Firestore if needed
                const userDoc = await db.collection('users').doc(existing.uid).get();
                if (!userDoc.exists || userDoc.data().firstName === studentId) {
                    await db.collection('users').doc(existing.uid).set({
                        uid: existing.uid,
                        email: email,
                        role: 'student',
                        studentId: studentId,
                        firstName: data.firstName || studentId,
                        lastName: data.lastName || '',
                        classRoom: data.classRoom || null,
                        createdAt: new Date()
                    }, { merge: true });
                    console.log(`   ↳ Updated: ${data.firstName} ${data.lastName || ''}`);
                }
                continue;
            } catch (e) {
                // User doesn't exist
            }

            // Create new user
            const user = await auth.createUser({
                email: email,
                password: password,
                displayName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || studentId
            });

            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: email,
                role: 'student',
                studentId: studentId,
                firstName: data.firstName || studentId,
                lastName: data.lastName || '',
                classRoom: data.classRoom || null,
                createdAt: new Date()
            });

            console.log(`✅ ${studentId}: Created (${data.firstName || studentId})`);
            created++;

        } catch (err) {
            console.error(`❌ ${studentId}: ${err.message}`);
            errors++;
        }
    }

    console.log('\n==================================================');
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Existed: ${exists}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('==================================================\n');

    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
