interface Env {
	RESEND_API_KEY: string;
}

interface ContactFormData {
	firstName: string;
	lastName: string;
	email: string;
	subject: string;
	message: string;
}

const subjectLabels: Record<string, string> = {
	'executive-opportunity': 'Executive Opportunity',
	'fractional-cio': 'Fractional CIO',
	'cio-advisory': 'CIO Advisory',
	speaking: 'Speaking Engagement',
	'podcast-media': 'Podcast or Media Inquiry',
	books: 'Books and Publications',
	general: 'General Inquiry'
};

function jsonResponse(
	body: Record<string, unknown>,
	status = 200
): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
	try {
		if (!context.env.RESEND_API_KEY) {
			console.error('RESEND_API_KEY is missing');

			return jsonResponse(
				{
					message:
						'The contact form is temporarily unavailable.'
				},
				500
			);
		}

		const formData = await context.request.formData();

		const data: ContactFormData = {
			firstName: String(formData.get('firstName') ?? '').trim(),
			lastName: String(formData.get('lastName') ?? '').trim(),
			email: String(formData.get('email') ?? '').trim(),
			subject: String(formData.get('subject') ?? '').trim(),
			message: String(formData.get('message') ?? '').trim()
		};

		if (
			!data.firstName ||
			!data.lastName ||
			!data.email ||
			!data.subject ||
			!data.message
		) {
			return jsonResponse(
				{
					message: 'Please complete all required fields.'
				},
				400
			);
		}

		if (!isValidEmail(data.email)) {
			return jsonResponse(
				{
					message: 'Please enter a valid email address.'
				},
				400
			);
		}

		if (
			data.firstName.length > 100 ||
			data.lastName.length > 100 ||
			data.email.length > 254 ||
			data.subject.length > 100 ||
			data.message.length > 5000
		) {
			return jsonResponse(
				{
					message: 'One or more fields are too long.'
				},
				400
			);
		}

		const subjectLabel =
			subjectLabels[data.subject] ?? 'General Inquiry';

		const fullName = `${data.firstName} ${data.lastName}`;

		const resendResponse = await fetch(
			'https://api.resend.com/emails',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
					'Content-Type': 'application/json',
					'User-Agent': 'federodrigo-contact-form/1.0'
				},
				body: JSON.stringify({
					from: 'Fede Rodrigo Website <contact@federodrigo.com>',
					to: ['contact@federodrigo.com'],
					reply_to: data.email,
					subject: `${subjectLabel} — ${fullName}`,
					html: `
						<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
							<h2 style="margin-bottom: 24px;">
								New website inquiry
							</h2>

							<p>
								<strong>Name:</strong><br>
								${escapeHtml(fullName)}
							</p>

							<p>
								<strong>Email:</strong><br>
								${escapeHtml(data.email)}
							</p>

							<p>
								<strong>Subject:</strong><br>
								${escapeHtml(subjectLabel)}
							</p>

							<p>
								<strong>Message:</strong>
							</p>

							<div style="white-space: pre-wrap;">
								${escapeHtml(data.message)}
							</div>
						</div>
					`,
					text: [
						'New website inquiry',
						'',
						`Name: ${fullName}`,
						`Email: ${data.email}`,
						`Subject: ${subjectLabel}`,
						'',
						'Message:',
						data.message
					].join('\n')
				})
			}
		);

		const resendResult = await resendResponse
			.json()
			.catch(() => null);

		if (!resendResponse.ok) {
			console.error('Resend error:', resendResult);

			return jsonResponse(
				{
					message:
						'Your message could not be sent. Please try again.'
				},
				502
			);
		}

		return jsonResponse({
			message: 'Thank you. Your message has been sent.'
		});
	} catch (error) {
		console.error('Contact form error:', error);

		return jsonResponse(
			{
				message:
					'Your message could not be sent. Please try again.'
			},
			500
		);
	}
};

export const onRequest: PagesFunction<Env> = async (context) => {
	if (context.request.method !== 'POST') {
		return jsonResponse(
			{
				message: 'Method not allowed.'
			},
			405
		);
	}

	return onRequestPost(context);
};
