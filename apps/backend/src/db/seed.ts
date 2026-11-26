import { createDatabase } from './client';
import { reviews, services, userRoles, users } from './schema';

if (process.env.SEED_DEMO_DATA !== 'true') {
	throw new Error(
		'Demo seed is disabled. Set SEED_DEMO_DATA=true explicitly to insert fictional sample users, services, and reviews.'
	);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL is required to seed demo data.');
}

const demoProviderId = '00000000-0000-4000-8000-000000000001';
const demoSeekerId = '00000000-0000-4000-8000-000000000002';

const demoServices = [
	{
		id: '00000000-0000-4000-8000-000000000101',
		title: 'Bantuan bersih-bersih rumah',
		description:
			'DEMO: Layanan kebersihan rutin untuk rumah dan apartemen. Jadwal dan kebutuhan dapat didiskusikan dengan penyedia.',
		category: 'Rumah tangga',
		price: 75000,
		priceUnit: 'hour' as const,
		location: 'Jakarta Selatan'
	},
	{
		id: '00000000-0000-4000-8000-000000000102',
		title: 'Desain logo untuk bisnismu',
		description:
			'DEMO: Bantuan desain identitas visual sederhana untuk usaha kecil. Ruang lingkup akhir dikonfirmasi sebelum pemesanan.',
		category: 'Desain',
		price: 250000,
		priceUnit: 'project' as const,
		location: 'Bandung · Online'
	},
	{
		id: '00000000-0000-4000-8000-000000000103',
		title: 'Pemeriksaan dan servis laptop',
		description:
			'DEMO: Pemeriksaan awal perangkat dan konsultasi perbaikan. Biaya tindakan lanjutan dikonfirmasi setelah pemeriksaan.',
		category: 'Teknologi',
		price: 100000,
		priceUnit: 'visit' as const,
		location: 'Surabaya'
	},
	{
		id: '00000000-0000-4000-8000-000000000104',
		title: 'Perawatan tanaman di rumah',
		description:
			'DEMO: Bantuan dasar merawat tanaman indoor, termasuk pengecekan kondisi dan saran perawatan.',
		category: 'Rumah tangga',
		price: 60000,
		priceUnit: 'hour' as const,
		location: 'Yogyakarta'
	},
	{
		id: '00000000-0000-4000-8000-000000000105',
		title: 'Belajar percakapan bahasa Inggris',
		description:
			'DEMO: Sesi latihan percakapan bahasa Inggris online untuk tingkat pemula hingga menengah.',
		category: 'Pendidikan',
		price: 90000,
		priceUnit: 'session' as const,
		location: 'Online'
	},
	{
		id: '00000000-0000-4000-8000-000000000106',
		title: 'Makeup untuk acara spesial',
		description:
			'DEMO: Layanan makeup untuk acara keluarga atau sesi foto. Detail waktu dan kebutuhan dibicarakan terlebih dahulu.',
		category: 'Kecantikan',
		price: 350000,
		priceUnit: 'session' as const,
		location: 'Jakarta Barat'
	}
];

const demoReviews = [
	{
		id: '00000000-0000-4000-8000-000000000201',
		serviceId: demoServices[0]!.id,
		rating: 5,
		comment: 'DEMO: Komunikasi jelas dan hasil kerja rapi.'
	},
	{
		id: '00000000-0000-4000-8000-000000000202',
		serviceId: demoServices[1]!.id,
		rating: 5,
		comment: 'DEMO: Proses diskusi kebutuhan terasa mudah.'
	},
	{
		id: '00000000-0000-4000-8000-000000000203',
		serviceId: demoServices[2]!.id,
		rating: 4,
		comment: 'DEMO: Penjelasan pemeriksaan perangkat cukup jelas.'
	}
];

const { db, client } = createDatabase(databaseUrl);

try {
	await db.transaction(async (tx) => {
		await tx
			.insert(users)
			.values([
				{
					id: demoProviderId,
					email: 'provider@demo.serbabisa.invalid',
					displayName: 'Demo — Nadia Putri'
				},
				{
					id: demoSeekerId,
					email: 'seeker@demo.serbabisa.invalid',
					displayName: 'Demo — Sarah W.'
				}
			])
			.onConflictDoUpdate({
				target: users.id,
				set: { updatedAt: new Date() }
			});

		await tx
			.insert(userRoles)
			.values([
				{ userId: demoProviderId, role: 'provider' },
				{ userId: demoSeekerId, role: 'seeker' }
			])
			.onConflictDoNothing();

		await tx
			.insert(services)
			.values(
				demoServices.map((service) => ({
					...service,
					ownerId: demoProviderId,
					status: 'active' as const
				}))
			)
			.onConflictDoUpdate({
				target: services.id,
				set: {
					title: services.title,
					description: services.description,
					category: services.category,
					price: services.price,
					priceUnit: services.priceUnit,
					location: services.location,
					status: 'active',
					updatedAt: new Date()
				}
			});

		await tx
			.insert(reviews)
			.values(demoReviews.map((review) => ({ ...review, authorId: demoSeekerId })))
			.onConflictDoUpdate({
				target: reviews.id,
				set: {
					serviceId: reviews.serviceId,
					authorId: reviews.authorId,
					rating: reviews.rating,
					comment: reviews.comment,
					status: 'published'
				}
			});
	});

	console.info(
		`Inserted or refreshed ${demoServices.length} clearly labelled demo listings and ${demoReviews.length} demo reviews.`
	);
} finally {
	await client.end();
}
