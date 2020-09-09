const Product = require('../models/product');
const { validationResult } = require('express-validator');
const fileHelper = require('../util/file');

const ITEMS_PER_PAGE = 3;

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        errorMessage: null,
        hasError: false,
        product: {
            title: '',
            imageUrl: '',
            price: '',
            description: ''
        },
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    var errors = validationResult(req);
    if (!errors.isEmpty() || !image) {
        const message = !image ? 'Please upload valid image!' : errors.array()[0].msg;
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            errorMessage: message,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            validationErrors: !image ? [] : errors.array()
        });
    }

    const product = new Product({
        title: title,
        imageUrl: '/' + image.path,
        price: price,
        description: description,
        userId: req.user
    });
    product.save()
        .then(result => {
            console.log('Product Added');
            return res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    const productId = req.params.productId;
    if (!editMode) {
        return res.redirect('/admin/products');
    }
    Product.findById(productId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                console.log('Unauthorized')
                return res.redirect('/admin/products');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                errorMessage: null,
                hasError: false,
                validationErrors: []
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = async (req, res, next) => {
    const productId = req.body.productId;
    const updatedTitle = req.body.title;
    const image = req.file;
    const updatedPrice = req.body.price;
    const updateDescription = req.body.description;

    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            errorMessage: message,
            hasError: true,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updateDescription,
                _id: productId
            },
            validationErrors: errors.array()
        });
    }

    Product.findById(productId)
        .then(product => {
            let gotError = false, gotErrorMessage = "";
            if (!product) {
                gotError = true;
                gotErrorMessage = "Product not found";
            }
            else if (product.userId.toString() !== req.user._id.toString()) {
                gotError = true;
                gotErrorMessage = "Unauthorized access";
            }
            if (gotError) {
                return res.status(422).render('admin/edit-product', {
                    pageTitle: 'Edit Product',
                    path: '/admin/edit-product',
                    editing: true,
                    errorMessage: gotErrorMessage,
                    hasError: true,
                    product: {
                        title: updatedTitle,
                        price: updatedPrice,
                        description: updateDescription,
                        _id: productId
                    },
                    validationErrors: []
                });
            }

            product.title = updatedTitle;
            if (image) {
                fileHelper.deleteFile(product.imageUrl.substring(1));
                product.imageUrl = '/' + image.path;
            }
            product.price = updatedPrice;
            product.description = updateDescription;
            product.save()
                .then(result => {
                    console.log("Product Updated")
                    res.redirect('/admin/products');
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    /*Product.find({ userId: req.user._id })
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find({ userId: req.user._id })
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })*/
    Product.find({ userId: req.user._id })
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products'/*,
                totalProducts: totalItems,
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)*/
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.status(400).json({ message: 'Product not found!' });
            }
            fileHelper.deleteFile(product.imageUrl.substring(1));
            return Product.deleteOne({ _id: prodId, userId: req.user._id });
        })
        .then(result => {
            console.log("Product Deleted")
            res.status(200).json({ message: 'Product Deleted!' });
        })
        .catch(err => {
            res.status(500).json({ message: 'Server Error!' });
        });
};