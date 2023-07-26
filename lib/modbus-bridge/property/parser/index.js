module.exports = {
    create(dataType) {
        let className = dataType;

        if (typeof className === 'object') className = className.type;
        const ParserClass = require(`./${className}`);

        return new ParserClass(dataType);
    }
};
