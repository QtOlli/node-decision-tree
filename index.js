// An easy decision tree based on: Let’s Write a Decision Tree Classifier from Scratch
// https://www.youtube.com/watch?v=LDRbO9a6XPU by Josh from Google Developers(https://twitter.com/random_forests)

// Hmm, what do we do first

// Maybe declare some data
// Features: Color, Size
// Label: Name of the fruit
const data = [
    ['blue', 1, 'blueberry'],
    ['yellow', 3, 'banana'],
    ['red', 1, 'apple'],
    ['green', 2, 'apple'],
    ['red', 1, 'grape'],
    ['orange', 2, 'orange'],
    ['brown', 4, 'coconut']
];

const header = ['color', 'size', 'name'];

function printDataInformation () {
    // Print the data header
    let headerFormatString = "\n|" + new Array(header.length + 1).join("\t%s\t|");
    console.log(headerFormatString, ...header);

    // Now print the data rows
    data.forEach(row => {
        let formatString = "\n|" + new Array(row.length + 1).join("\t%s\t|");
        console.log(formatString, ...row); 
    });

    console.log("\n\n");
}

printDataInformation();


// Create needed classes
class Question {
    constructor (column, value) {
        this.column = column;
        this.value = value;
    }

    match (example) {
        let exampleValue = example[this.column];
        // On a numeric value we compare >=
        // on a string value we compare equals
        if (Helper.isNumeric(exampleValue)) {
            return (exampleValue >= this.value);
        }

        // String
        return (exampleValue == this.value);
    }

    toString() {
        // Make the object human readable
        // usage: console.log(String(new Question(1, 2)));
        // We can override the inspect method, too.
        // Then we need no String(obj)
        let condition = "==";
        //
        if (Helper.isNumeric(this.value)) {
            condition = ">="
        }
            
        return `Is ${header[this.column]} ${condition} ${this.value}`;
    }
}

// Now lets get some helper functions
class Helper {
    // Get the unique keys of a column
    static uniqueValuesOfColumn(dataArray, columnOfArray) {
        // Check if the column exists
        let columnValues = [];
        dataArray.forEach(row => {
            if (columnOfArray < row.length) {
                columnValues.push(row[columnOfArray]);
            }
        });

        // Now make the array values unique
        // and return the new array
        // Set is an unique list, but not an array 
        // so we use the spread operator to create 
        // an new array of the set values.
        return [...(new Set(columnValues))];
    }

    // Count how many of each label(class) we got
    static classCountOfData(dataArray) {
        // Return object, label is the key, count the value
        let counts = {};
        //
        dataArray.forEach(row => {
            // Label is always the last element of the array
            // or the row itself, if its not an array
            const label = Array.isArray(row) ? row[row.length - 1] : row;
            // If the map didn't contains the label, add it with count 0
            // Then increment the count of the value
            if (!counts[label]) {
                // Add label
                counts[label] = 0;
            }

            // now incremnt the value
            ++counts[label]
        });

        return counts;
    }

    // Check if the value is numeric
    static isNumeric(value) {
        return (!isNaN(parseFloat(value)) && isFinite(value));
    }

    // Check for each row if its match the question
    static partition (dataArray, question) {
        // Usage: ({trueAnswers, falseAnswers} = Helper.partition(data, new Question(0, 'blue')));
        let trueAnswers = [];
        let falseAnswers = [];
        //
        dataArray.forEach(row => {
            if (question.match(row)) {
                trueAnswers.push(row);
            } else {
                falseAnswers.push(row);
            }
        });

        return {"trueAnswers" : trueAnswers, "falseAnswers" : falseAnswers};
    }

    // Calculate the gini impurity for a list of rows
    static giniImpurity (rows) {
        // Get the count of the unique labels
        const classCounts = Helper.classCountOfData(rows);
        //
        let impurity = 1;

        // Impurity = 1 - 1/n 
        // e.g. 5 differnt classes -> 1 - 1/5 = 0.8
        for(let label in classCounts) {
            const probablyOfClass = classCounts[label] / parseFloat(rows.length);
            //
            impurity -= probablyOfClass * probablyOfClass;
        }

        return impurity;
    }

    // Determine the information gain, between the nodes
    static informationGain (leftNode, rightNode, currentUncertainty) {
        // Information gain is entropy - weighted sum of entropy
        let classPercentage = parseFloat(leftNode.length) / (leftNode.length + rightNode.length);
        //
        return currentUncertainty - classPercentage * Helper.giniImpurity(leftNode) - (1 - classPercentage) * Helper.giniImpurity(rightNode);
    }

    // Find the best question to split the data
    static findBestSplit (rows) {
        // 
        let currentBestInformationGain = 0;
        //
        let bestSplitQuestion = undefined;
        //
        let currentUncertainty = Helper.giniImpurity(rows);
        // Determine the feature count of a row
        const featureCount = rows.length > 0 ? rows[0].length - 1 : 0;
        
        console.log("Feature count: %d", featureCount);
        //
        let featureIndex = 0;
        while (featureIndex < featureCount) {
            // Get the unique values of the feature(column)
            let values = Helper.uniqueValuesOfColumn(rows, featureIndex);
            // Lets write some little infomations
            console.log("Unique values %s of feature %s", values.join(","), header[featureIndex]);

            // Now build for each value the related question
            values.forEach(value => {
                let question = new Question(featureIndex, value);
                console.log("Create Question: %s", String(question));

                // Try to split the data
                //({trueAnswers, falseAnswers} = Helper.partition(data, new Question(0, 'blue')));
                let {trueAnswers, falseAnswers} = Helper.partition(rows, question);
                console.log("True answers: %s" , trueAnswers.length);
                console.log("False answers: %s" , falseAnswers.length);
                // Skip split, if it's doesn't split the data
                if (trueAnswers.length && falseAnswers.length) {
                    // Now figure out the information gain
                    let informationGain = Helper.informationGain(trueAnswers, falseAnswers, currentUncertainty);
                    console.log("Information gain: %d", informationGain);

                    // Do we got a better gain
                    if (informationGain >= currentBestInformationGain) {
                        // Yes, assign new values
                        currentBestInformationGain = informationGain;
                        //
                        bestSplitQuestion = question;
                    }
                }
            });

            // Next one please
            ++featureIndex;
        }

        console.log("Best split question[Gain: %d] is: %s", currentBestInformationGain, String(bestSplitQuestion));
        //
        return {"bestGain" : currentBestInformationGain, "bestQuestion" : bestSplitQuestion};
    }
}


// A leaf notes contains the class results
class Leaf {
    constructor (rows) {
        this.predictions = Helper.classCountOfData(rows)
    }
}

// Reprasents the questions and a link to the childs
class DecisionNode {
    constructor(question, trueBranch, falseBranch) {
        this.question = question
        this.trueBranch = trueBranch
        this.falseBranch = falseBranch
    }
}

function buildDecisionTree (rows) {
    // Find the best first split
    let {bestGain, bestQuestion} = Helper.findBestSplit(rows);

    if (bestGain == 0) {
        // No more questions our honor
        return new Leaf(rows);
    }
    
    // Split the data with the best question
    let {trueAnswers, falseAnswers} = Helper.partition(rows, bestQuestion);

    // Build the branches recursively
    let trueBranch = buildDecisionTree(trueAnswers);
    // And the false branch
    let falseBranch = buildDecisionTree(falseAnswers);

    // We return a decision node
    return new DecisionNode(bestQuestion, trueBranch, falseBranch);
}

function printTree (node, spacing = "") {
    if (node instanceof Leaf) {
        // Prints [object object], we need to fix that
        console.log("%sPredict: %s", spacing, node.predictions);
        //
        return;
    }

    // This is a decision node, print the question
    console.log("%s|%s", spacing, String(node.question));

    // Now print the true and false branch
    console.log("%s|--> True:", spacing);
    printTree(node.trueBranch, spacing + " ");
    //
    console.log("%s|--> False:", spacing);
    printTree(node.falseBranch, spacing + " ");
}

function classify (row, node) {
    //
    if (node instanceof Leaf) {
        //
        return node.predictions;
    }

    // Decision node
    if (node.question.match(row)) {
        return classify(row, node.trueBranch);
    } 

    // Follow false branch
    return classify(row, node.falseBranch);
}

function printLeaf (counts) {
    let total = 0;
    // Sum all counts 
    Object.keys(counts).forEach (className => {
        total += counts[className];
    });

    // Calculate percentage
    let probably = [];
    Object.keys(counts).forEach (className => {
        let currentCount = counts[className];
        //
        probably.push(`${className} ${parseInt(currentCount / total * 100)}%`);
    });

    return probably;
}


// We use CART (Classification and Regression Trees) algorithm
// Classification: e.g. Return a label
// Regression: e.g. Return a price or a temperature

// 
//
let tree = buildDecisionTree(data);
console.log("\n==============================\n");
printTree(tree);

// Test tree
console.log("\n\nTesting tree with training data\n");
data.forEach(row => {
    console.log("Test value: %s -> predicted value: %s", row[row.length - 1], printLeaf(classify(row, tree)).join(","))
});

