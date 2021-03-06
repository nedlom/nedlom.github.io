---
layout: post
title:      "Portfolio Project 1: CLI Data Gem"
date:       2021-06-09 13:27:54 -0400
permalink:  portfolio_project_1_cli_data_gem
---

Flatiron School's first project tasked me with creating a command line interface (CLI) application. It would have to scrape data from a website, define classes that correspond to whatever that data represents, and provide an interface for users to interact with the objects modeling our data. Given the previous lessons, and the abundance of list-based websites on the topic, I made the obvious choice: books.

Goodreads has number of book lists, with simple layouts, that link to individual book pages. Their *Most Read Books This Week In The United States* list felt like a good choice. It's content is dynamic and structure amenable to scraping. Three classes would suffice: Books, Scraper, and CLI. Inspection of the site determined the attributes, defined in the class below, that would be used to describe Book objects:
```
class MostReadBooks::Book

  attr_accessor :title, :author, :url, :avg_rating, :total_ratings, :readers, :doc, :format, :page_count, :publisher, :summary, :about_author

  def initialize(title=nil, author=nil, url=nil, readers=nil)
    @title = title
    @author = author
    @url = url
    @readers = readers
    self.class.all << self
  end
  . . .
	
end
```
The data assigned to instance variables upon initialization is scraped directly from the [*Most Read Books This Week In The United States*](https://www.goodreads.com/book/most_read) list, while the remaining methods defined using `attr_accessor` extract their data from individual book pages.

The CLI class controls the action of the program. Upon starting the application a new CLI object is instantiated and calls, the appropriately named,`start` method:  
```
class MostReadBooks::CLI

  def start
    MostReadBooks::Scraper.new.scrape_books
    puts ""
    puts "#{"-" * 30}Most Read Books#{"-" * 30}"
    puts "Welcome to Most Read Books. This application showcases the #{MostReadBooks::Book.all.length} most read"
    puts "books in the United States this week (according to Goodreads)." 
    puts ""
    list_books
  end
  . . .
	
end
```
`start` instantiates a Scraper object and and calls `scrape_books` on this new instance: 
```
class MostReadBooks::Scraper

  def scrape_books
    page = Nokogiri::HTML(open("https://www.goodreads.com/book/most_read").read)
    page.css("tr").each do |b|
      title = b.css("[itemprop='name']").first.text
      author = b.css("[itemprop='name']").last.text
      url = "https://www.goodreads.com/#{b.css(".bookTitle").first['href']}"
      readers = b.css(".greyText.statistic").text.strip.split("\n").first
      MostReadBooks::Book.new(title, author, url, readers)
    end
  end
	
end
```
`scrape_books`, the only method defined in the Scraper class, passes the webpage's HTML to `Nokogiri::HTML` which creates a Nokogiri object that we can call methods on to extract data. We call `css` on the Nokogiri object, pass in a css selector wrapped in a string, and a NodeSet is returned. Iterating over this set we assign data corresponding to Book attributes to local variables as we go, and then pass these variables to Book's `new` method which instantiates and saves a Book object for each book in the webpage's list. `start`'s last command is a call to `list_books` which allows the user to select the number of books they want to see: 
```
class MostReadBooks::CLI
  . . .
	
  def list_books
    print "How many books would you like to see? Enter a number from 1-#{MostReadBooks::Book.all.length}: "
    @input = gets.strip.to_i
    puts ""
    if (1..MostReadBooks::Book.all.length).include?(@input)
      puts "---Top #{@input} Most Read Books This Week"
      MostReadBooks::Book.print_books(@input)
      puts ""
      get_book
    else
      puts "Please enter a number from 1-#{MostReadBooks::Book.all.length}."
      puts ""
      list_books
    end
  end
  . . .
	
end
```
The user selects a number, which is assigned to `@input`, and `get_book` is called:
```
class MostReadBooks::Book
  . . .
	
  def get_book
    print "Select a book number for details (1-#{@input}): "
    book_number = gets.strip.to_i
    if (1..@input).include?(book_number)
      book = MostReadBooks::Book.find(book_number)
      puts ""
      display_book(book)
    else
      puts "Please enter a number from 1 - #{@input}."
      get_book
    end
  end
  . . .
	
end
```
`@input` is the one instance variable defined in the CLI class and shows up only in `list_books` and `get_book`. I wanted these methods separate, but given that a user can select how many books to list, and I only want them to be able to select a book from the list that was printed to the screen, `get_book` depends on the knowledge of how many books have been listed, which is the information assigned to `@input`, so an instance variable made sense here.

Once the user has selected a book `display_book` is called:
```
class MostReadBooks::Book
  . . .
  def display_book(book)
    puts "---Number #{MostReadBooks::Book.all.index(book) + 1} Most Read Book This Week"
    puts "Title: #{book.title}"
    puts "Author: #{book.author}"
    puts "Average Rating: #{book.avg_rating}"
    puts "Total Ratings: #{book.total_ratings}"
    puts "Publisher: #{book.publisher}"
    puts "Format: #{book.format}"
    puts "Page Count: #{book.page_count}"
    puts ""
    puts "#{book.title} has been read by #{book.readers} people this week."
    puts ""
    puts "---Summary"
    puts book.summary
    puts ""
    puts "---About Author"
    puts book.about_author
    puts ""
    see_more_books_or_exit
  end
  . . .
	
end
```
Checking the Book class we can see how the attributes used above, that were not defined in Book's `initialize` method, are obtained:
```
class MostReadBooks::Book
  . . .
	
  def doc
    @doc ||= Nokogiri::HTML(open(url).read)
  end
  
  def avg_rating
    @avg_rating ||= doc.css("[itemprop='ratingValue']").text.strip
  end
  
  def total_ratings
    @total_ratings ||= doc.css("[href='#other_reviews']").text.strip.split("\n").first
  end
  
  def format
    @format ||= doc.css("[itemprop='bookFormat']").text
  end
  . . .
	
end
```
`doc` sets (or returns) an instance variable `@doc` which stores a Nokogiri object corresponding to the HTML of a book's individual webpage. `doc` is then used, in conjunction with `css`, in each subsequent method setting an instance variable to the appropriate value scraped from the book's page. So, the instance variables for a Book object that are not set upon instantiation are set once a user selects that particular book.

Two methods from the Book class are worth noting:
```
class MostReadBooks::Book
  . . .
	
  def summary
    @summary ||= format_text(doc.css("#description span").last)
  end
  
  def about_author
    @about_author ||= if doc.css(".bookAuthorProfile span").empty?
      @about_author = "There is no information for this author"
    else
      if doc.css(".bookAuthorProfile span").length == 2
        @about_author = format_text(doc.css(".bookAuthorProfile span").last)
      else
        @about_author = format_text(doc.css(".bookAuthorProfile span").first)
      end
    end
  end
  . . .
	
end
```
`summary` and `about_author` both pass `doc.css(<selector>)` into a method I wrote called `format_text`. While it is possible to call `text` on `doc.css(<selector>)` and have returned a large string of unformatted text, to which I could apply my own formatting before it's printed to the screen, it seemed like a better idea to capture the webpage's structure along with the text when it is read into the program in order to preserve the flow of information defined in the page's HTML. This is precisely what `format_text` does: it returns a string of text we can simply pass to `puts` and have printed to the screen a layout almost identical to what is seen in the browser. This was tricky as the formatting was not uniform among pages, so there were a number of unique cases that had to be considered, but to keep this article at a reasonable length I'll forgo describing the mechanics of `format_text`.

Once a book has been displayed to the user, `see_more_books_or_exit` is called and the option is given to start the selection process over or exit the application, thus completing one full run through Most Read Books.

To anyone starting their first portfolio project who finds themself reading this, my advice is as follows:

* Don't get hung up on trying to build something profound.
* Don't spend a lot of time trying to find the perfect website.
* Do pick a website that approximates what you've seen in the lead up to the project. 
* Do spend some time mapping out the structure of your project. 

Then just start writing code. Pitfalls won't become clear until you get to the actual programming. If you hit a wall and can't proceed, it won't be such a big deal to scrap what you've done and start again because you'll have become aware of what to look out for in the next iteration.

The learning is in the doing.


