export type ServiceListing = {
	id: string;
	title: string;
	description: string;
	category: string;
	price: number;
	priceUnit: 'hour' | 'visit' | 'project' | 'session' | 'fixed';
	status: 'active' | 'unavailable' | 'draft' | 'suspended' | 'archived';
	location: string;
	createdAt: string;
	ownerName: string;
	rating: number;
	reviewCount: number;
};

export type ServiceReview = {
	id: string;
	rating: number;
	comment: string;
	createdAt: string;
	authorName: string;
	reply: {
		comment: string;
		createdAt: string;
		authorName: string;
	} | null;
};

export type ServiceDetail = ServiceListing & {
	reviews: ServiceReview[];
	weeklyAvailability: {
		dayOfWeek: number;
		isAvailable: boolean;
		startMinute: number;
		endMinute: number;
	}[];
	viewer: {
		isAuthenticated: boolean;
		canReview: boolean;
		canReply: boolean;
		canStartChat: boolean;
	};
};

export type ServiceListResponse = {
	data: ServiceListing[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

export function formatServicePrice(price: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	}).format(price);
}

export function formatPriceUnit(unit: ServiceListing['priceUnit']): string {
	const units: Record<ServiceListing['priceUnit'], string> = {
		hour: '/ jam',
		visit: '/ kunjungan',
		project: '/ proyek',
		session: '/ sesi',
		fixed: 'harga tetap'
	};

	return units[unit];
}
