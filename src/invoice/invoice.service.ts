import { Model } from 'mongoose';
import { Component, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryHelpers } from '../shared/helpers/query-helpers';
import { ServerResponse } from 'http';
import { InvoiceSchema } from './schema/invoice.schema';
import { Invoice } from './interfaces/invoice.interface';
import { InvoiceDto } from './dto/invoice.dto';
import { InvoiceSearchParamsDto } from './dto/invoice-search-params.dto';
import { ProfileSchema } from '../profile/schema/profile.schema';
import { Profile } from '../profile/interfaces/profile.interface';
import { HttpException } from '@nestjs/core';
import * as fs from 'fs';
import * as pdf from 'dynamic-html-pdf';
import * as Handlebars from 'handlebars';
import { Response } from 'express';

@Component()
export class InvoiceService {

    constructor(
        @InjectModel(InvoiceSchema) private readonly invoiceModel: Model<Invoice>,
        @InjectModel(ProfileSchema) private readonly profileModel: Model<Profile>
    ) { }

    async create(invoice: InvoiceDto): Promise<Invoice> {
        const createdInvoice = new this.invoiceModel(invoice);
        return await createdInvoice.save();
    }

    async find(parameters: InvoiceSearchParamsDto, res: ServerResponse): Promise<Invoice[]> {
        var searchParams: any = {};
        if (parameters.number) searchParams.number = parameters.number;
        if (parameters.customer && parameters.customer.name) searchParams["customer.name"] = { $regex: new RegExp(`^${parameters.customer.name}`, 'i') };

        return await QueryHelpers.find(this.invoiceModel, searchParams, parameters, res);
    }

    async findOne(invoiceId: string): Promise<Invoice> {
        return await this.invoiceModel.findById(invoiceId);
    }

    async update(invoiceId: string, invoice: InvoiceDto): Promise<Invoice> {
        return await this.invoiceModel.findOneAndUpdate({ _id: invoiceId }, { $set: invoice }, { new: true });
    }

    async generateInvoice(invoiceId: string, res: Response) {
        await this.invoiceModel.findById(invoiceId).exec()
            .then(invoice => {
                return this.profileModel.find().exec()
                    .then(profile => {
                        return [invoice, profile]
                    });
            })
            .then(result => {
                if (result[0] === null || result[1] === null) {
                    throw new HttpException('Not found', HttpStatus.NOT_FOUND);
                }
                else {
                    var template = fs.readFileSync(__dirname + '/templates/invoice-template.html', 'utf8');
                    var options = {
                        format: 'A4',
                        orientation: 'portrait',
                        border: '10mm'
                    };
                    var document = {
                        type: 'buffer',
                        template: template,
                        context: {
                            data: {
                                invoice: result[0] as Invoice,
                                profile: result[1][0] as Profile
                            }
                        }
                    };

                    return pdf.create(document, options)
                        .then((result) => {
                            res.setHeader('Content-Disposition', 'attachment; filename="' + document.context.data.invoice.number + '.pdf"');
                            res.setHeader('Content-type', 'application/pdf');
                            return res.send(result);
                        });
                }
            });
    }
}

Handlebars.registerHelper('short', function (date) {
    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
});

Handlebars.registerHelper('decimals', function (data) {
    return data.toFixed(2);
});