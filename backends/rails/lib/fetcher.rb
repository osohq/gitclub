# This module provides build/exec/combine implementations for ActiveRecord classes.
# The Ruby Oso library automatically checks for them when Oso#register_class is called
# without explicit implementations.
module Fetcher
  def self.included(base)
    base.instance_eval do

      # Turn a constraint into a param hash for #where
      query_clause = lambda do |c|
        if c.field.nil?
          { primary_key => c.value.send(primary_key) }
        else
          { c.field => c.value }
        end
      end

      # ActiveRecord automatically turns array values in where clauses into
      # IN conditions, so Eq and In can share the same code.
      @constraint_handlers = {
        'Eq'  => ->(query, constraint) { query.where     query_clause[constraint] },
        'In'  => ->(query, constraint) { query.where     query_clause[constraint] },
        'Neq' => ->(query, constraint) { query.where.not query_clause[constraint] }
      }

      @constraint_handlers.default_proc = proc do |k|
        raise "Unsupported constraint kind: #{k}"
      end

      @constraint_handlers.freeze

      # Create a query from an array of constraints
      def self.build_query(constraints)
        constraints.reduce(all) do |query, constraint|
          @constraint_handlers[constraint.kind][query, constraint]
        end
      end

      # Produce an array of values from a query
      def self.exec_query(query)
        query.distinct.to_a
      end

      # Merge two queries into a new query with the results from both
      def self.combine_query(one, two)
        one.or(two)
      end
    end
  end
end
