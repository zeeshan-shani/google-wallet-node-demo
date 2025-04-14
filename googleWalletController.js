const { JWT } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const serviceAccount = require('../config/service-account-key.json');
const { walletobjects } = require('@googleapis/walletobjects');
const { NewTicket, Event } = require('../models/dummy'); // mock models

class googleWallet {
    constructor() {
        this.issuerId = '3388000000022883775';
        this.classSuffix = 'gxticketsevent321';
        this.classId = `${this.issuerId}.${this.classSuffix}`;
        this.credentials = serviceAccount;

        this.authClient = new JWT({
            email: this.credentials.client_email,
            key: this.credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
        });

        this.service = walletobjects({
            version: 'v1',
            auth: this.authClient
        });
    }

    async createPassClass() {
        const eventTicketClass = {
            id: this.classId,
            classTemplateInfo: {
                cardTemplateOverride: {
                    cardRowTemplateInfos: [
                        {
                            twoItems: {
                                startItem: {
                                    firstValue: {
                                        fields: [
                                            { fieldPath: 'object.textModulesData["points"]' }
                                        ]
                                    }
                                },
                                endItem: {
                                    firstValue: {
                                        fields: [
                                            { fieldPath: 'object.textModulesData["contacts"]' }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                },
                detailsTemplateOverride: {
                    detailsItemInfos: [
                        {
                            item: {
                                firstValue: {
                                    fields: [
                                        { fieldPath: 'class.imageModulesData["event_banner"]' }
                                    ]
                                }
                            }
                        },
                        {
                            item: {
                                firstValue: {
                                    fields: [
                                        { fieldPath: 'class.textModulesData["game_overview"]' }
                                    ]
                                }
                            }
                        },
                        {
                            item: {
                                firstValue: {
                                    fields: [
                                        { fieldPath: 'class.linksModuleData.uris["official_site"]' }
                                    ]
                                }
                            }
                        }
                    ]
                }
            },
            imageModulesData: [
                {
                    mainImage: {
                        sourceUri: {
                            uri: 'https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/google-io-2021-card.png'
                        },
                        contentDescription: {
                            defaultValue: {
                                language: 'en-US',
                                value: 'Google I/O 2022 Banner'
                            }
                        }
                    },
                    id: 'event_banner'
                }
            ],
            textModulesData: [
                {
                    header: 'Gather points meeting new people at Google I/O',
                    body: 'Join the game and accumulate points in this badge by meeting other attendees in the event.',
                    id: 'game_overview'
                }
            ],
            linksModuleData: {
                uris: [
                    {
                        uri: 'https://io.google/2022/',
                        description: 'Official I/O \'22 Site',
                        id: 'official_site'
                    }
                ]
            }
        };

        try {
            await this.service.eventticketclass.get({ resourceId: this.classId });
            console.log('Class already exists');
        } catch (err) {
            if (err.code === 404) {
                const response = await this.service.eventticketclass.insert({ requestBody: eventTicketClass });
                console.log('Class created:', response.data);
            } else {
                throw err;
            }
        }
    }

    async createPassObject(email, userName, ticketId, ticketData = {}) {
        const objectId = `${this.issuerId}.${ticketId}`;

        const eventTicketObject = {
            id: objectId,
            classId: this.classId,
            state: 'ACTIVE',
            ticketHolderName: userName,
            ticketNumber: ticketData.code,
            ticketType: {
                translatedValues: [
                    {
                        language: "en",
                        value: ticketData.ticketType
                    }
                ],
                defaultValue: {
                    language: "en",
                    value: ticketData.ticketType
                }
            },
            faceValue: {
                micros: ticketData.price * 1000000,
                currencyCode: "USD"
            },
            barcode: {
                type: 'QR_CODE',
                value: ticketData.qrData
            },
            validTimeInterval: {
                start: { date: new Date(ticketData.startDateTime).toISOString() },
                end: { date: new Date(new Date(ticketData.startDateTime).getTime() + 4 * 60 * 60 * 1000).toISOString() }
            },
            heroImage: {
                sourceUri: {
                    uri: 'https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/google-io-hero-demo-only.jpg'
                },
                contentDescription: {
                    defaultValue: {
                        language: 'en-US',
                        value: 'Hero image'
                    }
                }
            },
            textModulesData: [
                { header: 'EVENT NAME', body: ticketData.eventName, id: 'ename' },
                { header: 'LOCATION', body: ticketData.location, id: 'location' },
                { header: 'START TIME', body: new Date(ticketData.startDateTime).toLocaleString(), id: 'start' }
            ],
            linksModuleData: {
                uris: [
                    {
                        uri: 'https://developers.google.com/wallet',
                        description: 'Google Wallet Developers',
                        id: 'developer_site'
                    }
                ]
            }
        };

        try {
            await this.service.eventticketobject.get({ resourceId: objectId });
            console.log('Object already exists');
        } catch (err) {
            if (err.code === 404) {
                await this.service.eventticketobject.insert({ requestBody: eventTicketObject });
            } else {
                throw err;
            }
        }

        const claims = {
            iss: this.credentials.client_email,
            aud: 'google',
            origins: [],
            typ: 'savetowallet',
            payload: { eventTicketObjects: [eventTicketObject] }
        };

        const token = jwt.sign(claims, this.credentials.private_key, { algorithm: 'RS256' });
        return `https://pay.google.com/gp/v/save/${token}`;
    }

    async generateWalletLink(req, res) {
        try {
            const { ticketId, userName } = req.body;
            const email = "zak@gmail.com";

            const ticket = await NewTicket.findOne({ where: { id: ticketId }, include: [{ model: Event, as: 'event' }] });

            if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

            const {
                qrCode, ticketType, price, ticketName, code, qrData
            } = ticket;

            const {
                eventName, location, startDateTime
            } = ticket.event;

            if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

            await this.createPassClass();
            const saveUrl = await this.createPassObject(email, userName, ticketId, {
                qrCode, ticketType, price, ticketName, code, eventName, location, startDateTime, qrData
            });

            return res.status(200).json({ success: true, saveUrl });
        } catch (error) {
            console.error('Error generating wallet link:', error);
            return res.status(500).json({ success: false, message: 'Failed to generate wallet link', error: error.message });
        }
    }
}

module.exports = new googleWallet();
